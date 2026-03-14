"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SessionBuilder } from "@/components/tenants/sessions/editor/session-builder";
import {
  buildSessionPayload,
  createEmptySessionFormData,
} from "@/components/tenants/sessions/session-form-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminCollegesQuery,
  useCreateSessionMutation,
} from "@/lib/queries/admin";
import { SessionCreationCollege } from "@/components/tenants/sessions/create";
import { isTenantEligibilityDimensionEnabled } from "@/lib/tenant-config";

export default function CreateSessionPage() {
  const router = useRouter();
  const { token, hasHydrated, tenant } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const needsStructureData =
    isTenantEligibilityDimensionEnabled(tenant, "college") ||
    isTenantEligibilityDimensionEnabled(tenant, "department") ||
    isTenantEligibilityDimensionEnabled(tenant, "level");
  const collegesQuery = useAdminCollegesQuery(
    {},
    { enabled: isAuthorized && needsStructureData },
  );
  const createSession = useCreateSessionMutation();

  const colleges =
    (collegesQuery.data?.colleges as SessionCreationCollege[] | undefined) ?? [];
  const initialData = useMemo(() => createEmptySessionFormData(), []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

  if (!hasHydrated || (needsStructureData && collegesQuery.isLoading)) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading session setup...",
          needsStructureData
            ? "Fetching participant structure..."
            : "Applying tenant-wide eligibility...",
          "Preparing create workflow...",
        ]}
      />
    );
  }

  if (needsStructureData && collegesQuery.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {collegesQuery.error instanceof Error
                ? collegesQuery.error.message
                : "Failed to load participant structure"}
            </p>
            <Button
              variant="outline"
              onClick={() => void collegesQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SessionBuilder
      key="create-session"
      mode="create"
      title="Create Session Wizard"
      description="Build a complete voting session in guided steps based on this tenant's participant structure."
      colleges={colleges}
      initialData={initialData}
      isSubmitting={createSession.isPending}
      onCancel={() => router.push("/dashboard/sessions")}
      onSubmit={async (formData, eligibleCollegeIds) => {
        await createSession.mutateAsync(
          buildSessionPayload(formData, eligibleCollegeIds),
        );
        router.push("/dashboard/sessions");
      }}
    />
  );
}
