"use client";

import { Activity } from "lucide-react";
import {
  useAdminDatabaseStatsQuery,
  useAdminSystemHealthQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemHealthPage() {
  const healthQuery = useAdminSystemHealthQuery();
  const databaseQuery = useAdminDatabaseStatsQuery();

  if (healthQuery.isLoading || databaseQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Checking system health...",
          "Inspecting database statistics...",
          "Preparing status checks...",
        ]}
      />
    );
  }

  const health = healthQuery.data?.health;
  const database = databaseQuery.data?.database_statistics;

  if (!health || !database) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          System health data is unavailable right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live status checks for infrastructure dependencies and database activity.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(health.checks).map(([key, value]) => (
          <Card key={key} className="border shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize text-foreground">
                  {key}
                </p>
                <Badge variant="outline">{value.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{value.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Collection totals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{database.students.total}</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Votes</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{database.votes.total}</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{database.sessions.total}</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Audit logs</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{database.audit_logs}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Database distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {database.sessions.by_status.map((entry) => (
              <div key={`session-${entry._id}`} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Session status: {entry._id}
                </p>
                <p className="text-sm text-muted-foreground">{entry.count} records</p>
              </div>
            ))}
            {database.votes.by_status.map((entry) => (
              <div key={`vote-${entry._id}`} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Vote status: {entry._id}
                </p>
                <p className="text-sm text-muted-foreground">{entry.count} records</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
