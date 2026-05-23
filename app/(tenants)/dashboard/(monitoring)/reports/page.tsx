"use client";

import { useMemo, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminSessionsQuery,
  useAdminStudentsOverviewQuery,
  useExportDataMutation,
} from "@/lib/queries/admin";
import { TenantAccessRestricted, TenantPageHeader } from "@/components/tenants/shared";
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const canExportReports = hasAnyTenantPermission(membership, ["reports.export", "tenant.manage"]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const exportData = useExportDataMutation();
  const studentsOverviewQuery = useAdminStudentsOverviewQuery({ enabled: canExportReports });
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 100 }, { enabled: canExportReports });

  const [state, setState] = useState<ExportState>({
    format: "csv",
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
  const selectedCollege = colleges.find((c) => c.id === state.studentCollege);
  const departments = selectedCollege?.departments || [];

  const reportTypes = useMemo(
    () => [
      {
        key: "votes",
        label: "Vote records",
        description: "Download vote records for one election or the full voting history.",
        filters: [
          {
            key: "votesSessionId",
            label: "Election",
            options: [{ value: "all", label: "All elections" }, ...sessions.map((s) => ({ value: s._id, label: s.title }))],
          },
        ],
        buildFilters: () => (state.votesSessionId !== "all" ? { session_id: state.votesSessionId } : {}),
      },
      {
        key: "students",
        label: `${participantLabels.plural} registry`,
        description: `Export ${participantLabels.plural.toLowerCase()} by college, department, level, or full registry.`,
        filters: [
          {
            key: "studentCollege",
            label: "College",
            options: [{ value: "all", label: "All colleges" }, ...colleges.map((c) => ({ value: c.id, label: c.name }))],
          },
          {
            key: "studentDepartment",
            label: "Department",
            options: [{ value: "all", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
          },
          {
            key: "studentLevel",
            label: "Level",
            options: [{ value: "all", label: "All levels" }, ...levels.map((l) => ({ value: l, label: l }))],
          },
        ],
        buildFilters: () => ({
          ...(state.studentCollege !== "all" ? { college: selectedCollege?.name } : {}),
          ...(state.studentDepartment !== "all" ? { department: departments.find((d) => d.id === state.studentDepartment)?.name } : {}),
          ...(state.studentLevel !== "all" ? { level: state.studentLevel } : {}),
        }),
      },
      {
        key: "sessions",
        label: "Elections",
        description: "Export election definitions and candidate setup by lifecycle state.",
        filters: [
          {
            key: "sessionStatus",
            label: "Status",
            options: [{ value: "all", label: "All statuses" }, { value: "upcoming", label: "Upcoming" }, { value: "active", label: "Active" }, { value: "ended", label: "Ended" }],
          },
        ],
        buildFilters: () => (state.sessionStatus !== "all" ? { status: state.sessionStatus } : {}),
      },
      {
        key: "admins",
        label: "Administrators",
        description: "Download administrator assignments and role posture.",
        filters: [
          {
            key: "adminRole",
            label: "Role",
            options: [{ value: "all", label: "All roles" }, { value: "owner", label: "Owner" }, { value: "admin", label: "Admin" }, { value: "support", label: "Support" }, { value: "analyst", label: "Analyst" }],
          },
        ],
        buildFilters: () => (state.adminRole !== "all" ? { role: state.adminRole } : {}),
      },
      {
        key: "audit_logs",
        label: "Audit logs",
        description: "Extract tenant audit activity for compliance and operations review.",
        filters: [],
        buildFilters: () => ({}),
      },
    ],
    [colleges, departments, levels, participantLabels.plural, selectedCollege?.name, sessions, state.adminRole, state.sessionStatus, state.studentCollege, state.studentDepartment, state.studentLevel, state.votesSessionId],
  );

  if (!canExportReports) {
    return <TenantAccessRestricted title="Reports access restricted" subtitle="Your role does not allow data export and reporting." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Reporting"
        icon={<FileBarChart className="h-5 w-5" />}
        title="Reports"
        subtitle="Generate filtered exports for votes, participants, elections, admins, and audit history."
        stats={[
          { label: "Report types", value: reportTypes.length },
          { label: "Format", value: state.format.toUpperCase() },
          { label: "Elections", value: sessions.length },
          { label: "Delivery", value: "Download" },
        ]}
      />

      {/* Format selector */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm text-muted-foreground">Export format</Label>
        <Select value={state.format} onValueChange={(v: "json" | "csv") => setState((s) => ({ ...s, format: v }))}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report cards grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {reportTypes.map((report) => {
          const filters = report.buildFilters();
          return (
            <div key={report.key} className="rounded-xl border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{report.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{report.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={Boolean(activeExportKey)}
                  onClick={async () => {
                    setActiveExportKey(report.key);
                    try {
                      const blob = await exportData.mutateAsync({ dataType: report.key, format: state.format, filters });
                      downloadBlob(blob, `${report.key.replace("_", "-")}-${new Date().toISOString()}.${state.format}`);
                      toast.success(`${report.label} exported`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : `Failed to export ${report.label.toLowerCase()}`);
                    } finally {
                      setActiveExportKey(null);
                    }
                  }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {activeExportKey === report.key ? "Exporting…" : "Export"}
                </Button>
              </div>

              {report.filters.length > 0 ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {report.filters.map((filter) => (
                    <div key={`${report.key}-${filter.key}`}>
                      <Label className="mb-1 block text-[11px] text-muted-foreground">{filter.label}</Label>
                      <Select
                        value={state[filter.key as keyof ExportState]}
                        onValueChange={(value) =>
                          setState((s) => {
                            const next = { ...s, [filter.key]: value };
                            if (filter.key === "studentCollege") next.studentDepartment = "all";
                            return next;
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Full tenant-scoped dataset — no additional filters.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
