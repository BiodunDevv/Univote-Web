"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SessionBuilder } from "@/components/tenants/sessions/editor/session-builder";
import {
  buildSessionPayload,
  createEmptySessionFormData,
  normalizeSessionForForm,
} from "@/components/tenants/sessions/session-form-utils";
import { SessionCreationCollege } from "@/components/tenants/sessions/create";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TenantAccessRestricted } from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  useAdminCollegesQuery,
  useAdminSessionDetailQuery,
  useCreateCandidateMutation,
  useDeleteCandidateMutation,
  useUpdateCandidateMutation,
  useUpdateSessionMutation,
} from "@/lib/queries/admin";
import { ApiError } from "@/lib/api/client";
import { isTenantEligibilityDimensionEnabled } from "@/lib/tenant-config";

function getSessionUpdateErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const restrictedFields = Array.isArray(error.payload?.restricted_fields)
      ? error.payload.restricted_fields.join(", ")
      : null;

    if (error.code === "ELIGIBILITY_DIMENSION_DISABLED") {
      return error.message;
    }

    if (restrictedFields) {
      return `${error.message} Restricted fields: ${restrictedFields}.`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not save this session right now. Please review your changes and try again.";
}

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { token, hasHydrated, tenant, admin, membership } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const tenantReady = hasHydrated && Boolean(tenant);
  const canManageSessions =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["sessions.manage", "tenant.manage"]);
  const needsStructureData =
    isTenantEligibilityDimensionEnabled(tenant, "college") ||
    isTenantEligibilityDimensionEnabled(tenant, "department") ||
    isTenantEligibilityDimensionEnabled(tenant, "level");
  const collegesQuery = useAdminCollegesQuery(
    {},
    { enabled: isAuthorized && needsStructureData },
  );
  const sessionDetailQuery = useAdminSessionDetailQuery(sessionId, {
    enabled: isAuthorized,
  });
  const updateSession = useUpdateSessionMutation(sessionId);
  const createCandidate = useCreateCandidateMutation(sessionId);
  const updateCandidate = useUpdateCandidateMutation(sessionId);
  const deleteCandidate = useDeleteCandidateMutation(sessionId);
  const currentSession = sessionDetailQuery.data?.session;
  const colleges =
    (collegesQuery.data?.colleges as SessionCreationCollege[] | undefined) ??
    [];

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

  useEffect(() => {
    if (currentSession && currentSession.status === "ended") {
      router.replace(`/dashboard/sessions/${sessionId}`);
    }
  }, [currentSession, router, sessionId]);

  const initialData = useMemo(() => {
    if (!currentSession) return createEmptySessionFormData();
    return normalizeSessionForForm(currentSession);
  }, [currentSession]);

  if (
    !hasHydrated ||
    !tenantReady ||
    sessionDetailQuery.isLoading ||
    (needsStructureData && collegesQuery.isLoading)
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading session configuration...",
          needsStructureData
            ? "Syncing university eligibility scope..."
            : "Applying tenant-wide eligibility...",
          "Preparing edit workflow...",
        ]}
      />
    );
  }

  if (!canManageSessions) {
    return (
      <TenantAccessRestricted
        title="Session editing is restricted"
        description="Your current university role can’t update voting sessions. Ask your workspace owner for session management access if you need to make changes."
      />
    );
  }

  if (
    (needsStructureData && collegesQuery.error) ||
    sessionDetailQuery.error ||
    !currentSession
  ) {
    const message =
      (sessionDetailQuery.error instanceof Error
        ? sessionDetailQuery.error.message
        : undefined) ||
      (needsStructureData && collegesQuery.error instanceof Error
        ? collegesQuery.error.message
        : undefined) ||
      "Failed to load this session";

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/sessions")}
              >
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void Promise.all([
                    ...(needsStructureData ? [collegesQuery.refetch()] : []),
                    sessionDetailQuery.refetch(),
                  ]);
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SessionBuilder
      key={sessionId}
      mode="edit"
      title="Edit Session Wizard"
      description={
        currentSession.status === "active"
          ? "This session is live. You can still update presentation and operational fields, extend the closing time, and widen eligibility coverage. Ballot structure and candidate deletion remain locked while votes are being recorded."
          : needsStructureData
            ? "Update this session using the same college and department eligibility workflow as session creation."
            : "Update this session using the same guided workflow. This tenant uses tenant-wide eligibility, so all eligible members remain included automatically."
      }
      colleges={colleges}
      initialData={initialData}
      isSubmitting={updateSession.isPending}
      onCancel={() => router.push(`/dashboard/sessions/${sessionId}`)}
      onSubmit={async (formData, eligibleCollegeIds) => {
        const payload = buildSessionPayload(formData, eligibleCollegeIds);
        try {
          await updateSession.mutateAsync({
            title: payload.title,
            description: payload.description,
            start_time: payload.start_time,
            end_time: payload.end_time,
            location: payload.location,
            categories: payload.categories,
            eligible_college: payload.eligible_college,
            eligible_departments: payload.eligible_departments,
            eligible_levels: payload.eligible_levels,
            is_off_campus_allowed: payload.is_off_campus_allowed,
            results_public: payload.results_public,
          });
        } catch (submitError) {
          throw new Error(getSessionUpdateErrorMessage(submitError));
        }
        router.push(`/dashboard/sessions/${sessionId}`);
      }}
      onCreateCandidate={(payload) => createCandidate.mutateAsync(payload)}
      onUpdateCandidate={(candidateId, payload) =>
        updateCandidate.mutateAsync({ candidateId, payload })
      }
      onDeleteCandidate={(candidateId) =>
        deleteCandidate.mutateAsync(candidateId)
      }
      candidatePermissions={{
        canCreate: currentSession.status === "upcoming",
        canEdit:
          currentSession.status === "upcoming" ||
          currentSession.status === "active",
        canDelete: currentSession.status === "upcoming",
      }}
      liveEditGuidance={
        currentSession.status === "active"
          ? [
              "You can extend the closing time, but you cannot shorten a live session.",
              "Eligibility can only be widened while voting is live. Existing departments and levels cannot be removed.",
              "You can update title, description, location, off-campus access, and results visibility.",
              "Ballot structure, candidate creation, and candidate deletion remain locked to protect recorded votes.",
            ]
          : undefined
      }
    />
  );
}
