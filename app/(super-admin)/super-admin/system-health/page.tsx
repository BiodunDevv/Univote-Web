"use client";

import { Activity } from "lucide-react";
import {
  usePlatformDatabaseStatsQuery,
  usePlatformSystemHealthQuery,
} from "@/lib/queries/platform";
import { TenantPageHeader } from "@/components/tenants/shared/page-header";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformSystemHealthPage() {
  const healthQuery = usePlatformSystemHealthQuery();
  const databaseQuery = usePlatformDatabaseStatsQuery();

  if (healthQuery.isLoading || databaseQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Checking platform health...",
          "Inspecting database distribution...",
          "Preparing infrastructure summary...",
        ]}
      />
    );
  }

  const health = healthQuery.data?.health;
  const database = databaseQuery.data?.database_statistics;
  const errorMessage = healthQuery.error?.message || databaseQuery.error?.message;

  if (!health || !database) {
    return (
      <Card className="border-destructive/40 shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {errorMessage || "System health data is unavailable right now."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TenantPageHeader
        eyebrow="Platform console"
        icon={<Activity className="h-4 w-4" />}
        title="System Health"
        subtitle="Cross-platform infrastructure checks and global database activity distribution."
        stats={[
          { label: "Participants", value: database.students.total },
          { label: "Votes", value: database.votes.total },
          { label: "Audit logs", value: database.audit_logs },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(health.checks).map(([key, value]) => (
          <Card key={key} className="border shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize text-foreground">{key}</p>
                <Badge variant="outline">{value.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{value.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>Collection totals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {database.students.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {database.admins.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Votes</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {database.votes.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Audit logs</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {database.audit_logs}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {database.sessions.by_status.map((entry) => (
              <div key={`session-${entry._id}`} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Sessions: {entry._id}
                </p>
                <p className="text-sm text-muted-foreground">{entry.count} records</p>
              </div>
            ))}
            {database.votes.by_status.map((entry) => (
              <div key={`vote-${entry._id}`} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Votes: {entry._id}</p>
                <p className="text-sm text-muted-foreground">{entry.count} records</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
