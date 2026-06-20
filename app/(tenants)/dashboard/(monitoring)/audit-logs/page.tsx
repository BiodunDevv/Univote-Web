"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, FileText, RefreshCw } from "lucide-react";
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
  TenantPageHeader,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const { membership } = useAuthStore();
  const canViewAuditLogs = hasAnyTenantPermission(membership, [
    "reports.export",
    "analytics.view",
    "tenant.manage",
  ]);
  const [page, setPage] = useState(1);
  const limit = 25;
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("csv");

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
  const pagination = auditLogsQuery.data?.pagination || { total: 0, page: 1, limit, pages: 1 };
  const actions = auditActionsQuery.data?.actions || [];

  const activeFilterCount = useMemo(
    () => [action !== "all", Boolean(startDate), Boolean(endDate)].filter(Boolean).length,
    [action, endDate, startDate],
  );
  const latestEventAt = logs[0]?.timestamp
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(logs[0].timestamp))
    : "—";

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
      downloadBlob(blob, `audit-logs-${new Date().toISOString()}.${exportFormat}`);
      toast.success("Audit logs exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export audit logs");
    }
  };

  if (auditLogsQuery.isLoading || auditActionsQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading audit logs…", "Pulling activity filters…"]} />;
  }

  if (!canViewAuditLogs) {
    return <TenantAccessRestricted title="Audit log access restricted" subtitle="Your role does not allow audit review." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Oversight"
        icon={<FileText className="h-5 w-5" />}
        title="Audit Logs"
        subtitle="Review tenant administrative activity and export filtered compliance records."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => auditLogsQuery.refetch()} disabled={auditLogsQuery.isFetching}>
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${auditLogsQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleExport} disabled={exportData.isPending}>
              <Download className="mr-2 h-3.5 w-3.5" />
              {exportData.isPending ? "Exporting…" : "Export"}
            </Button>
          </div>
        }
        stats={[
          { label: "Total logs", value: pagination.total.toLocaleString() },
          { label: "Active filters", value: activeFilterCount.toLocaleString() },
          { label: "Latest event", value: latestEventAt },
          { label: "Format", value: exportFormat.toUpperCase() },
        ]}
      />

      {auditLogsQuery.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{auditLogsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* Inline filter bar */}
      <div className="flex flex-wrap gap-2">
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <InputGroup className="w-full sm:w-52">
          <InputGroupAddon align="inline-start">
            <FileText className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            type="datetime-local"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="text-sm"
          />
        </InputGroup>
        <InputGroup className="w-full sm:w-52">
          <InputGroupAddon align="inline-start">
            <FileText className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            type="datetime-local"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="text-sm"
          />
        </InputGroup>
        <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "json" | "csv")}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => { setAction("all"); setStartDate(""); setEndDate(""); setPage(1); }}>
            Clear ({activeFilterCount})
          </Button>
        ) : null}
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <TenantAuditLogTable logs={logs} />
          <TablePaginationControls
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <TenantEmptyState
          icon={FileText}
          title="No audit logs matched"
          description="Adjust the action or time filters, or refresh to inspect the latest activity."
        />
      )}
    </div>
  );
}
