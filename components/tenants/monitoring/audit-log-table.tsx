"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminAuditLogEntry } from "@/lib/queries/admin";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function summarizeDetails(details: Record<string, unknown>) {
  const directMessage = details.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const firstReadableEntry = Object.entries(details).find(([, value]) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    return false;
  });

  if (!firstReadableEntry) {
    return "No additional audit detail was recorded for this event.";
  }

  const [key, value] = firstReadableEntry;
  return `${key.replaceAll("_", " ")}: ${String(value)}`;
}

export function TenantAuditLogTable({
  logs,
}: {
  logs: AdminAuditLogEntry[];
}) {
  return (
    <div className="min-w-0">
      <div className="grid gap-2 xl:hidden">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-xl border border-border/70 bg-background p-3 shadow-none"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {log.admin?.name || "System event"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(log.timestamp)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{log.action}</Badge>
                {log.tenant ? (
                  <Badge variant="secondary">{log.tenant.slug}</Badge>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Actor
                </p>
                <p className="mt-1 text-sm font-medium">
                  {log.admin?.email || "No admin identity attached"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Network
                </p>
                <p className="mt-1 text-sm font-medium">
                  {log.ip_address || "No IP recorded"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Details
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {summarizeDetails(log.details)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Timestamp</TableHead>
            <TableHead className="w-[180px]">Action</TableHead>
            <TableHead className="w-[220px]">Actor</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[180px]">Network</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="align-top text-sm text-muted-foreground">
                {formatTimestamp(log.timestamp)}
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{log.action}</Badge>
                  {log.tenant ? (
                    <Badge variant="secondary">{log.tenant.slug}</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {log.admin?.name || "System event"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.admin?.email || "No admin identity attached"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {summarizeDetails(log.details)}
                  </p>
                  {Object.keys(log.details).length > 1 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(log.details)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <Badge
                            key={`${log.id}-${key}`}
                            variant="outline"
                            className="max-w-[220px] truncate text-[10px]"
                            title={`${key}: ${String(value)}`}
                          >
                            {key.replaceAll("_", " ")}: {String(value)}
                          </Badge>
                        ))}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="align-top text-xs text-muted-foreground">
                <div className="space-y-1">
                  <p>{log.ip_address || "No IP recorded"}</p>
                  <p className="line-clamp-2 max-w-[180px]">{log.user_agent || "No user agent"}</p>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
