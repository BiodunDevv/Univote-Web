"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useCleanupPlatformAuditLogsMutation,
  usePlatformAuditActionsQuery,
  usePlatformAuditLogsQuery,
} from "@/lib/queries/platform";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(value: string) {
  return format(new Date(value), "PPP p");
}

export default function PlatformAuditLogsPage() {
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cleanupDays, setCleanupDays] = useState("90");

  const auditLogsQuery = usePlatformAuditLogsQuery({
    limit: 50,
    action: action === "all" ? undefined : action,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });
  const auditActionsQuery = usePlatformAuditActionsQuery();
  const cleanupMutation = useCleanupPlatformAuditLogsMutation();

  const logs = auditLogsQuery.data?.audit_logs || [];
  const actions = auditActionsQuery.data?.actions || [];

  const handleCleanupPreview = async () => {
    try {
      const result = await cleanupMutation.mutateAsync({
        days_old: Number(cleanupDays) || 90,
        preview: true,
      });
      toast.info(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to preview cleanup",
      );
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await cleanupMutation.mutateAsync({
        days_old: Number(cleanupDays) || 90,
      });
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cleanup audit logs",
      );
    }
  };

  if (auditLogsQuery.isLoading || auditActionsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading platform audit logs...",
          "Pulling admin activity stream...",
          "Preparing cleanup controls...",
        ]}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-4xl border bg-linear-to-br from-card via-card to-muted/30 p-4 shadow-none sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Platform Audit Logs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review cross-tenant administrative activity, platform mutations, and
          cleanup posture.
        </p>
      </section>

      {auditLogsQuery.error ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {auditLogsQuery.error.message}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border shadow-none">
          <CardHeader className="gap-4">
            <div>
              <CardTitle>Activity stream</CardTitle>
              <CardDescription>
                Latest platform and tenant-admin operations recorded by the
                audit pipeline.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Action" />
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
                className="w-full"
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                type="datetime-local"
                value={endDate}
                className="w-full"
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{log.action}</Badge>
                      {log.tenant ? (
                        <Badge variant="secondary">{log.tenant.slug}</Badge>
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium">
                        {log.admin?.name || "Unknown admin"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.admin?.email || "No email available"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typeof log.details?.message === "string"
                        ? log.details.message
                        : JSON.stringify(log.details)}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-left text-xs text-muted-foreground lg:text-right">
                    <p>{formatDate(log.timestamp)}</p>
                    <p className="break-all">
                      {log.ip_address || "No IP recorded"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No audit logs match the current filter.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border shadow-none xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle>Cleanup controls</CardTitle>
            <CardDescription>
              Preview and remove old audit logs once retention rules require it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cleanup-days">Retention window in days</Label>
              <Input
                id="cleanup-days"
                type="number"
                min={1}
                value={cleanupDays}
                onChange={(event) => setCleanupDays(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCleanupPreview}
                disabled={cleanupMutation.isPending}
              >
                Preview cleanup
              </Button>
              <Button
                className="w-full"
                onClick={handleCleanup}
                disabled={cleanupMutation.isPending}
              >
                Delete old logs
              </Button>
            </div>
            <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
              Cleanup is permanent. Preview first if you need a safe count
              before deletion.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
