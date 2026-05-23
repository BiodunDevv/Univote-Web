"use client";

import { useMemo, useState } from "react";
import { Download, FileBarChart, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminSessionsQuery,
  useAdminStudentsOverviewQuery,
  useExportDataMutation,
} from "@/lib/queries/admin";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

type ExportState = {
  format: "json" | "csv";
  votesSessionId: string;
  studentCollege: string;
  studentDepartment: string;
  studentLevel: string;
  sessionStatus: string;
  adminRole: string;
};

export default function ReportsPage() {
  const { tenant, membership } = useAuthStore();
  const canExportReports = hasAnyTenantPermission(membership, [
    "reports.export",
    "tenant.manage",
  ]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const exportData = useExportDataMutation();
  const studentsOverviewQuery = useAdminStudentsOverviewQuery({
    enabled: canExportReports,
  });
  const sessionsQuery = useAdminSessionsQuery(
    { page: 1, limit: 100 },
    { enabled: canExportReports },
  );
  const [state, setState] = useState<ExportState>({
    format: "json",
    votesSessionId: "all",
    studentCollege: "all",
    studentDepartment: "all",
    studentLevel: "all",
    sessionStatus: "all",
    adminRole: "all",
  });
  const [activeExportKey, setActiveExportKey] = useState<string | null>(null);

  const colleges = studentsOverviewQuery.data?.colleges || [];
  const sessions = sessionsQuery.data?.sessions || [];
  const levels = studentsOverviewQuery.data?.levels || [];
  const selectedCollege = colleges.find(
    (college) => college.id === state.studentCollege,
  );
  const departments = selectedCollege?.departments || [];

  const reportTypes = useMemo(
    () => [
      {
        key: "votes",
        label: "Vote records",
        description:
          "Download vote records for one election or export the full voting history for this university.",
        filters: [
          {
            key: "votesSessionId",
            label: "Election",
            options: [
              { value: "all", label: "All elections" },
              ...sessions.map((session) => ({
                value: session._id,
                label: session.title,
              })),
            ],
          },
        ],
        buildFilters: () =>
          state.votesSessionId !== "all"
            ? { session_id: state.votesSessionId }
            : {},
      },
      {
        key: "students",
        label: `${participantLabels.plural} registry`,
        description: `Export ${participantLabels.plural.toLowerCase()} by college, department, level, or the full university-wide registry.`,
        filters: [
          {
            key: "studentCollege",
            label: "College",
            options: [
              { value: "all", label: "All colleges" },
              ...colleges.map((college) => ({
                value: college.id,
                label: college.name,
              })),
            ],
          },
          {
            key: "studentDepartment",
            label: "Department",
            options: [
              { value: "all", label: "All departments" },
              ...departments.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ],
          },
          {
            key: "studentLevel",
            label: "Level",
            options: [
              { value: "all", label: "All levels" },
              ...levels.map((levelOption) => ({
                value: levelOption,
                label: levelOption,
              })),
            ],
          },
        ],
        buildFilters: () => ({
          ...(state.studentCollege !== "all"
            ? { college: selectedCollege?.name }
            : {}),
          ...(state.studentDepartment !== "all"
            ? {
                department: departments.find(
                  (department) => department.id === state.studentDepartment,
                )?.name,
              }
            : {}),
          ...(state.studentLevel !== "all" ? { level: state.studentLevel } : {}),
        }),
      },
      {
        key: "sessions",
        label: "Elections",
        description:
          "Export election definitions and candidate setup by lifecycle state.",
        filters: [
          {
            key: "sessionStatus",
            label: "Status",
            options: [
              { value: "all", label: "All statuses" },
              { value: "upcoming", label: "Upcoming" },
              { value: "active", label: "Active" },
              { value: "ended", label: "Ended" },
            ],
          },
        ],
        buildFilters: () =>
          state.sessionStatus !== "all" ? { status: state.sessionStatus } : {},
      },
      {
        key: "admins",
        label: "Administrators",
        description:
          "Download university administrator assignments and role posture.",
        filters: [
          {
            key: "adminRole",
            label: "Role",
            options: [
              { value: "all", label: "All roles" },
              { value: "owner", label: "Owner" },
              { value: "admin", label: "Admin" },
              { value: "support", label: "Support" },
              { value: "analyst", label: "Analyst" },
            ],
          },
        ],
        buildFilters: () =>
          state.adminRole !== "all" ? { role: state.adminRole } : {},
      },
      {
        key: "audit_logs",
        label: "Audit logs",
        description:
          "Extract tenant audit activity for investigations, compliance, and operations review.",
        filters: [],
        buildFilters: () => ({}),
      },
    ],
    [
      colleges,
      departments,
      levels,
      participantLabels.plural,
      selectedCollege?.name,
      sessions,
      state.adminRole,
      state.sessionStatus,
      state.studentCollege,
      state.studentDepartment,
      state.studentLevel,
      state.votesSessionId,
    ],
  );

  if (!canExportReports) {
    return (
      <TenantAccessRestricted
        title="Reports access restricted"
        subtitle="Your university role does not allow data export and reporting."
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant reporting"
        icon={<FileBarChart className="h-5 w-5" />}
        title="Reports Center"
        subtitle="Generate filtered exports for votes, students, elections, administrator assignments, and audit history from one review-ready workspace."
        stats={[
          {
            label: "Export sets",
            value: reportTypes.length.toLocaleString(),
          },
          {
            label: "Format",
            value: state.format.toUpperCase(),
          },
          {
            label: "Election filters",
            value: sessions.length.toLocaleString(),
          },
          {
            label: "Delivery",
            value: "Direct download",
          },
        ]}
      />

      <TenantSectionCard
        title="Export preferences"
        description="Pick a format once, then run focused reports against the current university dataset."
      >
        <div className="max-w-xs">
          <Select
            value={state.format}
            onValueChange={(value: "json" | "csv") =>
              setState((current) => ({ ...current, format: value }))
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TenantSectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {reportTypes.map((report) => {
          const activeFilters = report.buildFilters();
          const activeFilterEntries = Object.entries(activeFilters).filter(
            ([, value]) => value !== undefined && value !== null && value !== "",
          );

          return (
            <TenantSectionCard
              key={report.key}
              title={report.label}
              description={report.description}
              action={
                <Button
                  disabled={Boolean(activeExportKey)}
                  onClick={async () => {
                    setActiveExportKey(report.key);
                    try {
                      const blob = await exportData.mutateAsync({
                        dataType: report.key,
                        format: state.format,
                        filters: activeFilters,
                      });
                      const filterSuffix = activeFilterEntries
                        .map(([, value]) => String(value))
                        .join("-")
                        .replace(/\s+/g, "-")
                        .toLowerCase();
                      downloadBlob(
                        blob,
                        `${report.key.replace("_", "-")}${filterSuffix ? `-${filterSuffix}` : ""}-${new Date().toISOString()}.${state.format}`,
                      );
                      toast.success(`${report.label} exported`);
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : `Failed to export ${report.label.toLowerCase()}`,
                      );
                    } finally {
                      setActiveExportKey(null);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {activeExportKey === report.key ? "Exporting..." : "Export"}
                </Button>
              }
            >
              <div className="space-y-4">
                {report.filters.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {report.filters.map((filter) => (
                      <div key={`${report.key}-${filter.key}`} className="space-y-2">
                        <Label>{filter.label}</Label>
                        <Select
                          value={state[filter.key as keyof ExportState]}
                          onValueChange={(value) =>
                            setState((current) => {
                              const next = {
                                ...current,
                                [filter.key]: value,
                              };

                              if (filter.key === "studentCollege") {
                                next.studentDepartment = "all";
                              }

                              return next;
                            })
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue
                              placeholder={`Select ${filter.label.toLowerCase()}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <Filter className="h-4 w-4" />
                    Active filters
                  </div>
                  <p>
                    {activeFilterEntries.length > 0
                      ? activeFilterEntries
                          .map(
                            ([key, value]) =>
                              `${key.replace(/_/g, " ")}: ${String(value)}`,
                          )
                          .join(" • ")
                      : "No additional filters applied. This export will include the full tenant-scoped dataset for the selected report."}
                  </p>
                </div>
              </div>
            </TenantSectionCard>
          );
        })}
      </div>
    </div>
  );
}
