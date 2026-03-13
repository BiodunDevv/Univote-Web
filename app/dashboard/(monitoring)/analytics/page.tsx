"use client";

import { BarChart3 } from "lucide-react";
import {
  useAdminDashboardQuery,
  useAdminResultsOverviewQuery,
  useAdminSessionSummaryQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const dashboardQuery = useAdminDashboardQuery();
  const summaryQuery = useAdminSessionSummaryQuery();
  const resultsOverviewQuery = useAdminResultsOverviewQuery();

  if (
    dashboardQuery.isLoading ||
    summaryQuery.isLoading ||
    resultsOverviewQuery.isLoading
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading analytics overview...",
          "Compiling session metrics...",
          "Preparing participation snapshots...",
        ]}
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const summary = summaryQuery.data?.summary;
  const resultsOverview = resultsOverviewQuery.data?.overview;

  if (!dashboard || !summary || !resultsOverview) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Analytics data is currently unavailable.
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: "Participation rate", value: `${dashboard.overview.participation_rate}%` },
    { label: "Average turnout", value: `${resultsOverview.average_turnout}%` },
    { label: "Total sessions", value: summary.total_sessions },
    { label: "Total votes", value: summary.total_votes },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              High-level election performance across turnout, engagement, and recent system activity.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top voters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.top_voters.slice(0, 5).map((voter) => (
              <div key={voter.matric_no} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">{voter.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {voter.department} • {voter.college}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {voter.votes_cast} sessions voted
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recent_activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {activity.user_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.action} {activity.resource}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
