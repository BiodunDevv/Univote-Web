"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ShieldCheck, UserRound } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  useAdminStudentDetailQuery,
  useUpdateStudentMutation,
} from "@/lib/queries/admin";
import type { Student } from "@/types/student";
import {
  formatParticipantIdentifier,
  isTenantParticipantFieldEnabled,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const backRef = searchParams.get("ref") || "/dashboard/students";

  const { token, hasHydrated, tenant, admin, membership } = useAuthStore();
  const participantLabels = { singular: "Student", plural: "Students" };
  const isAuthorized = hasHydrated && Boolean(token);
  const canManageStudent =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["students.manage", "tenant.manage"]);
  const studentDetailQuery = useAdminStudentDetailQuery(studentId, {
    enabled: isAuthorized,
  });
  const updateStudent = useUpdateStudentMutation(studentId);
  const currentStudent = studentDetailQuery.data?.student;
  const error =
    studentDetailQuery.error instanceof Error
      ? studentDetailQuery.error.message
      : null;

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
          "Loading student form...",
          `Loading ${participantLabels.singular.toLowerCase()} form...`,
          "Fetching profile fields...",
          "Preparing edit workspace...",
        ]}
      />
    );
  }

  if (!canManageStudent) {
    return (
      <TenantAccessRestricted
        title="Student editing is restricted"
        description="Your current university role can’t update student records. Ask your workspace owner for student management access if you need to make changes."
      />
    );
  }

  if (!currentStudent) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="text-sm font-semibold">
              {error || `${participantLabels.singular} not found`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => router.push(backRef)}>
                Back
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
    <div className="mx-auto flex min-w-0 w-full max-w-3xl flex-1 flex-col gap-2">
      <TenantPageHeader
        eyebrow={`Tenant ${participantLabels.plural.toLowerCase()}`}
        icon={<UserRound className="h-5 w-5" />}
        title={`Edit ${participantLabels.singular}`}
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
        stats={[
          ...(shouldShowTenantParticipantFieldInProfile(tenant, "college")
            ? [
                {
                  label: "College",
                  value: currentStudent.college || "Not used",
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
          {
            label: "Face verification",
            value: currentStudent.has_facial_data ? "Ready" : "Pending",
          },
        ]}
      />
      <EditStudentForm
        key={currentStudent._id}
        student={currentStudent}
        tenant={tenant}
        participantSingularLabel={participantLabels.singular}
        error={error}
        isSubmitting={updateStudent.isPending}
        onCancel={() => router.push(backRef)}
        onSubmit={async (payload) => {
          try {
            await updateStudent.mutateAsync(payload);
            router.push(backRef);
          } catch {
            return;
          }
        }}
      />
    </div>
  );
}

function EditStudentForm({
  student,
  tenant,
  participantSingularLabel,
  error,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  student: Student;
  tenant: ReturnType<typeof useAuthStore.getState>["tenant"];
  participantSingularLabel: string;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    full_name: string;
    email: string;
    level: string;
    is_active: boolean;
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(student.full_name || "");
  const [email, setEmail] = useState(student.email || "");
  const [level, setLevel] = useState(student.level || "100");
  const [isActive, setIsActive] = useState(Boolean(student.is_active));
  const showEmail = isTenantParticipantFieldEnabled(tenant, "email");
  const showLevel = isTenantParticipantFieldEnabled(tenant, "level");

  return (
    <TenantSectionCard
      title={`${participantSingularLabel} profile`}
      description={`Update the identity fields and access state for this ${participantSingularLabel.toLowerCase()} account.`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit({
            full_name: fullName,
            email,
            level,
            is_active: isActive,
          });
        }}
        className="space-y-3"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          {showEmail ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {showLevel ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Level</Label>
              <Input
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-border/70 bg-background/80 p-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Verification state
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {student.has_facial_data
                    ? `This ${participantSingularLabel.toLowerCase()} already has facial verification data.`
                    : "No facial verification record is attached yet."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Active Status</p>
            <p className="text-xs text-muted-foreground">
              {`Toggle ${participantSingularLabel.toLowerCase()} access`}
            </p>
          </div>
          <Checkbox
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </TenantSectionCard>
  );
}
