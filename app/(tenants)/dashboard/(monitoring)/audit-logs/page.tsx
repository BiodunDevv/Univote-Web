"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, FileText, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminAuditActionsQuery,
  useAdminAuditLogsQuery,
  useExportDataMutation,
} from "@/lib/queries/admin";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { TenantAuditLogTable } from "@/components/tenants/monitoring";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export default function AuditLogsPage() {
  const { membership } = useAuthStore();
  const canViewAuditLogs = hasAnyTenantPermission(membership, [
    "reports.export",
    "analytics.view",
    "tenant.manage",
  ]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const auditLogsQuery = useAdminAuditLogsQuery({
    page,
    limit,
    action: action === "all" ? undefined : action,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });
  const auditActionsQuery = useAdminAuditActionsQuery();
  const exportData = useExportDataMutation();

  const logs = auditLogsQuery.data?.audit_logs || [];
  const pagination = auditLogsQuery.data?.pagination || {
    total: 0,
    page: 1,
    limit,
    pages: 1,
  };
  const actions = auditActionsQuery.data?.actions || [];

  const activeFilterCount = useMemo(
    () => [action !== "all", Boolean(startDate), Boolean(endDate)].filter(Boolean).length,
    [action, endDate, startDate],
  );
  const actorCount = useMemo(
    () => new Set(logs.map((log) => log.admin?.id).filter(Boolean)).size,
    [logs],
  );
  const latestEventAt = logs[0]?.timestamp
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(logs[0].timestamp))
    : "No events";

  const handleResetFilters = () => {
    setAction("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const blob = await exportData.mutateAsync({
        dataType: "audit_logs",
        format: exportFormat,
        filters: {
          action: action === "all" ? undefined : action,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });

      downloadBlob(
        blob,
        `tenant-audit-logs-${new Date().toISOString()}.${exportFormat}`,
      );
      toast.success("Audit logs exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export audit logs");
    }
  };

  if (auditLogsQuery.isLoading || auditActionsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading tenant audit logs...",
          "Pulling activity filters...",
          "Preparing compliance view...",
        ]}
      />
    );
  }

  if (!canViewAuditLogs) {
    return (
      <TenantAccessRestricted
        title="Audit log access restricted"
        subtitle="Your university role does not allow audit review and compliance exports."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant oversight"
        icon={<FileText className="h-5 w-5" />}
        title="Audit Logs"
        subtitle="Review tenant-scoped administrative activity, export filtered evidence, and keep a tight operational trail without leaving the workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => auditLogsQuery.refetch()}
              disabled={auditLogsQuery.isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${auditLogsQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exportData.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportData.isPending ? "Exporting..." : "Export logs"}
            </Button>
          </div>
        }
        stats={[
          {
            label: "Filtered logs",
            value: pagination.total.toLocaleString(),
          },
          {
            label: "Visible actors",
            value: actorCount.toLocaleString(),
          },
          {
            label: "Active filters",
            value: activeFilterCount.toLocaleString(),
          },
          {
            label: "Latest event",
            value: latestEventAt,
          },
        ]}
      />

      {auditLogsQuery.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{auditLogsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TenantSectionCard
          title="Filter the activity stream"
          description="Narrow the tenant activity feed by action and time window before exporting or reviewing details."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
            />
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
            />
            <Button variant="outline" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Export controls"
          description="Download the current tenant audit view in the format your compliance workflow expects."
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_1fr]">
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as "json" | "csv")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              The export uses the active tenant scope and current filter state, so the downloaded
              file matches exactly what your team is reviewing here.
            </div>
          </div>
        </TenantSectionCard>
      </div>

      <TenantMetricGrid columns={3}>
        <TenantMetricCard
          label="Page coverage"
          value={`${logs.length.toLocaleString()} rows`}
          hint={`Page ${pagination.page} of ${pagination.pages}`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Actor diversity"
          value={actorCount.toLocaleString()}
          hint="Unique admins represented in the current slice."
          icon={<Users className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Export mode"
          value={exportFormat.toUpperCase()}
          hint="Switch formats before generating a compliance export."
          icon={<Download className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <TenantSectionCard
        title="Tenant activity stream"
        description="A structured log of the administrative actions recorded for this tenant workspace."
        contentClassName="px-0 pb-0"
      >
        {logs.length > 0 ? (
          <>
            <div className="px-6 pb-6">
              <TenantAuditLogTable logs={logs} />
            </div>
            <TablePaginationControls
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="px-6 pb-6">
            <TenantEmptyState
              icon={FileText}
              title="No audit logs matched this view"
              description="Adjust the action or time filters, or refresh to inspect the latest tenant activity."
            />
          </div>
        )}
      </TenantSectionCard>
    </div>
  );
}
