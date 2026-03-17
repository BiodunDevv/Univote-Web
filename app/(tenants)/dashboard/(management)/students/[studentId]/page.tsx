"use client";

export const dynamic = "force-dynamic";

import { useEffect, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  GraduationCap,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStudentDetailQuery } from "@/lib/queries/admin";
import {
  formatParticipantIdentifier,
  isTenantParticipantFieldEnabled,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";
import {
  hasTenantPermission,
  TenantEmptyState,
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const studentId = params.studentId;
  const backRef = searchParams.get("ref") || "/dashboard/students";

  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = { singular: "Student", plural: "Students" };
  const photoEnabled = isTenantParticipantFieldEnabled(tenant, "photo_url");
  const isAuthorized = hasHydrated && Boolean(token);
  const canManageStudent =
    admin?.role === "super_admin" ||
    hasTenantPermission(membership?.permissions, [
      "students.manage",
      "tenant.manage",
    ]);

  const studentDetailQuery = useAdminStudentDetailQuery(studentId, {
    enabled: isAuthorized,
  });
  const currentStudent = studentDetailQuery.data?.student;
  const votingHistory = studentDetailQuery.data?.voting_history ?? [];

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace(`/auth/signin?ref=${encodeURIComponent(backRef)}`);
    }
  }, [backRef, hasHydrated, router, token]);

  if (!hasHydrated || studentDetailQuery.isLoading) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          `Loading ${participantLabels.singular.toLowerCase()} workspace...`,
          "Fetching voting history...",
          "Preparing the profile view...",
        ]}
      />
    );
  }

  if (!currentStudent) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 items-center justify-center p-2">
        <Card className="w-full max-w-md rounded-[1.75rem] border shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="text-sm font-semibold">
              {studentDetailQuery.error instanceof Error
                ? studentDetailQuery.error.message
                : `${participantLabels.singular} not found`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => router.push(backRef)}>
                {`Back to ${participantLabels.plural}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => void studentDetailQuery.refetch()}
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
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-4 p-2">
      <TenantPageHeader
        eyebrow={`Tenant ${participantLabels.plural.toLowerCase()}`}
        icon={<User className="h-5 w-5" />}
        title={currentStudent.full_name}
        subtitle={[
          formatParticipantIdentifier(
            currentStudent as unknown as Record<string, unknown>,
            tenant,
          ),
          shouldShowTenantParticipantFieldInProfile(tenant, "department")
            ? currentStudent.department
            : null,
        ]
          .filter(Boolean)
          .join(" • ")}
        onBack={() => router.push(backRef)}
        actions={
          canManageStudent ? (
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() =>
                router.push(
                  `/dashboard/students/${studentId}/edit?ref=${encodeURIComponent(backRef)}`,
                )
              }
            >
              {`Edit ${participantLabels.singular}`}
            </Button>
          ) : undefined
        }
        stats={[
          ...(shouldShowTenantParticipantFieldInProfile(tenant, "college")
            ? [
                {
                  label: "College",
                  value: currentStudent.college || "Not used",
                },
              ]
            : []),
          ...(shouldShowTenantParticipantFieldInProfile(tenant, "department")
            ? [
                {
                  label: "Department",
                  value: currentStudent.department || "Not used",
                },
              ]
            : []),
          ...(shouldShowTenantParticipantFieldInProfile(tenant, "level")
            ? [
                {
                  label: "Level",
                  value: currentStudent.level || "Not used",
                },
              ]
            : []),
          {
            label: "Status",
            value: currentStudent.is_active ? "Active" : "Inactive",
          },
        ]}
      />

      <TenantMetricGrid>
        <TenantMetricCard
          label="Voting records"
          value={votingHistory.length.toLocaleString()}
          hint={`Sessions this ${participantLabels.singular.toLowerCase()} has participated in so far.`}
          icon={<Shield className="h-4 w-4" />}
        />
        {photoEnabled ? (
          <TenantMetricCard
            label="Face verification"
            value={currentStudent.has_facial_data ? "Ready" : "Pending"}
            hint="Whether a facial verification record is attached."
            icon={<User className="h-4 w-4" />}
          />
        ) : null}
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_minmax(0,1fr)]">
        <TenantSectionCard
          title={`${participantLabels.singular} profile`}
          description={`Identity, placement, and account readiness for this tenant ${participantLabels.singular.toLowerCase()}.`}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ProfileField
              label="Identifier"
              value={
                formatParticipantIdentifier(
                  currentStudent as unknown as Record<string, unknown>,
                  tenant,
                ) || "Not set"
              }
              icon={<User className="h-4 w-4" />}
              breakWords
            />
            <ProfileField
              label="Email"
              value={currentStudent.email || "Not set"}
              icon={<Mail className="h-4 w-4" />}
              breakWords
            />
            {shouldShowTenantParticipantFieldInProfile(tenant, "college") ? (
              <ProfileField
                label="College"
                value={currentStudent.college || "Not used"}
                icon={<Building2 className="h-4 w-4" />}
              />
            ) : null}
            {shouldShowTenantParticipantFieldInProfile(tenant, "department") ? (
              <ProfileField
                label="Department"
                value={currentStudent.department || "Not used"}
                icon={<GraduationCap className="h-4 w-4" />}
              />
            ) : null}
            <ProfileField
              label="Access state"
              value={currentStudent.is_active ? "Active" : "Inactive"}
              icon={<Shield className="h-4 w-4" />}
            />
            {photoEnabled ? (
              <ProfileField
                label="Verification"
                value={
                  currentStudent.has_facial_data
                    ? "Facial data registered"
                    : "No facial data"
                }
                icon={<User className="h-4 w-4" />}
              />
            ) : null}
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Voting history"
          description={`Session participation records currently attached to this ${participantLabels.singular.toLowerCase()} account.`}
        >
          {votingHistory.length === 0 ? (
            <TenantEmptyState
              icon={Shield}
              title="No voting records yet"
              description={`Voting history will appear here once the ${participantLabels.singular.toLowerCase()} participates in a session.`}
            />
          ) : (
            <div className="space-y-3">
              {votingHistory.map((vote) => (
                <div
                  key={vote._id}
                  className="rounded-2xl border border-border/70 bg-muted/10 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {vote.session_id?.title || "Session"}
                    </p>
                    <span className="rounded-full bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {vote.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(
                      vote.voted_at || vote.timestamp || "",
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TenantSectionCard>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon,
  breakWords = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  breakWords?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className={`mt-3 text-sm font-medium text-foreground ${
          breakWords ? "break-all" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
