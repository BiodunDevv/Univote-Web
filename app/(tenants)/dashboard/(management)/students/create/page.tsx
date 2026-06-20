"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { CreateStudentModal } from "@/components/tenants/students/Modals";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { TenantAccessRestricted, TenantPageHeader } from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  useAdminStudentsOverviewQuery,
  useUploadStudentsMutation,
} from "@/lib/queries/admin";
import type { StudentCSVData, UploadStudentsResponse } from "@/types/student";

export default function CreateStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated, admin, membership } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] =
    useState<UploadStudentsResponse["results"] | null>(null);

  const canManageStudents =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["students.manage", "tenant.manage"]);
  const mode = searchParams.get("mode") === "bulk" ? "bulk" : "manual";
  const overviewQuery = useAdminStudentsOverviewQuery({
    enabled: hasHydrated && Boolean(token) && canManageStudents,
  });
  const uploadStudents = useUploadStudentsMutation();

  const handleCreateManual = async (payload: StudentCSVData) => {
    setSubmitError(null);
    const response = await uploadStudents.mutateAsync({
      csvData: [payload],
      target: {
        college: payload.college,
        department: payload.department,
        level: payload.level,
      },
    });
    setUploadSummary(response.results);
    toast.success("Student created", {
      description: `${response.results.created} created, ${response.results.failed} failed`,
    });
    if (
      response.results.created > 0 &&
      response.results.failed === 0 &&
      response.results.errors.length === 0
    ) {
      router.push("/dashboard/students");
    }
  };

  const handleCreateBulk = async (
    csvData: StudentCSVData[],
    target?: { college?: string; department?: string; level?: string },
  ) => {
    setSubmitError(null);
    const response = await uploadStudents.mutateAsync({ csvData, target });
    setUploadSummary(response.results);
    toast.success("Upload completed", {
      description: `${response.results.created} created, ${response.results.failed} failed out of ${response.results.total}`,
    });
  };

  if (!hasHydrated || !token) {
    return <ChangingLoadingState messages={["Preparing student form..."]} />;
  }

  if (!canManageStudents) {
    return (
      <TenantAccessRestricted
        title="Student creation is restricted"
        description="Your current role cannot create student records."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Student registry"
        icon={<GraduationCap className="h-5 w-5" />}
        title="Add Student"
        subtitle="Create one student or upload a CSV batch using the same registry rules."
        onBack={() => router.push("/dashboard/students")}
        stats={[
          { label: "Mode", value: mode === "bulk" ? "Bulk upload" : "Manual" },
          {
            label: "Colleges",
            value: overviewQuery.data?.colleges.length.toLocaleString() || "0",
          },
          {
            label: "Levels",
            value: overviewQuery.data?.levels.length.toLocaleString() || "0",
          },
        ]}
      />

      {overviewQuery.isLoading ? (
        <ChangingLoadingState messages={["Loading student structure...", "Preparing form options..."]} />
      ) : overviewQuery.error ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-start gap-2 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">
              {overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : "Failed to load student structure"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <CreateStudentModal
          open
          inline
          onOpenChange={(open) => {
            if (!open) router.push("/dashboard/students");
          }}
          overview={overviewQuery.data ?? null}
          initialMode={mode}
          isSubmitting={uploadStudents.isPending}
          submitError={submitError}
          onCreateManual={async (payload) => {
            try {
              await handleCreateManual(payload);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to create student";
              setSubmitError(message);
              toast.error("Create failed", { description: message });
            }
          }}
          onCreateBulk={async (rows, target) => {
            try {
              await handleCreateBulk(rows, target);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to upload students";
              setSubmitError(message);
              toast.error("Upload failed", { description: message });
            }
          }}
        />
      )}

      {uploadSummary ? (
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground">Upload summary</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {uploadSummary.created} created · {uploadSummary.failed} failed · {uploadSummary.total} submitted
            </p>
            {uploadSummary.errors.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {uploadSummary.errors.slice(0, 6).map((item, index) => (
                  <div key={`${item.matric_no}-${index}`} className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs font-medium text-foreground">
                      {item.full_name} ({item.matric_no})
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.error || item.warning}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
