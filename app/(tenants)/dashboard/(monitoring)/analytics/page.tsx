"use client";

import { BarChart3, Activity, Users, Vote } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminAnalyticsOverviewQuery } from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";

const trendChartConfig = {
  votes: {
    label: "Votes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const turnoutChartConfig = {
  turnout: {
    label: "Turnout %",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const analyticsQuery = useAdminAnalyticsOverviewQuery();

  if (analyticsQuery.isLoading) {
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

  const analytics = analyticsQuery.data;

  if (!analytics) {
    return (
      <TenantSectionCard
        title="Analytics unavailable"
        description="The advanced analytics service did not return data for this tenant."
      >
        <p className="text-sm text-muted-foreground">
          Retry in a moment or confirm the tenant still has analytics access on
          the active plan.
        </p>
      </TenantSectionCard>
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant monitoring"
        icon={<BarChart3 className="h-5 w-5" />}
        title="Analytics Overview"
        subtitle="Follow turnout momentum, session performance, and the most active users from one chart-driven command surface."
        stats={[
          {
            label: "Participation",
            value: `${analytics.overview.participation_rate}%`,
          },
          {
            label: "Average turnout",
            value: `${analytics.overview.average_turnout}%`,
          },
          {
            label: "Votes",
            value: analytics.overview.total_votes.toLocaleString(),
          },
          {
            label: "Sessions",
            value: analytics.overview.total_sessions.toLocaleString(),
          },
        ]}
      />

      <TenantMetricGrid columns={3}>
        <TenantMetricCard
          label={`${participantLabels.plural} ready`}
          value={analytics.overview.total_students.toLocaleString()}
          hint={`${analytics.overview.students_who_voted.toLocaleString()} ${participantLabels.plural.toLowerCase()} have already voted.`}
          icon={<Users className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Votes recorded"
          value={analytics.overview.total_votes.toLocaleString()}
          hint={`${analytics.overview.active_sessions.toLocaleString()} active sessions and ${analytics.overview.upcoming_sessions.toLocaleString()} upcoming.`}
          icon={<Vote className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Operational activity"
          value={analytics.recent_activities.length.toLocaleString()}
          hint="Recent changes and actions that affected election operations."
          icon={<Activity className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TenantSectionCard
          title="Vote trend"
          description="Daily voting volume across the sessions contributing to advanced analytics."
        >
          <ChartContainer
            config={trendChartConfig}
            className="h-[280px] w-full"
          >
            <AreaChart accessibilityLayer data={analytics.vote_trend}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="votes"
                stroke="var(--color-votes)"
                fill="var(--color-votes)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </TenantSectionCard>

        <TenantSectionCard
          title="Turnout by session"
          description={`Compare turnout percentage against eligible ${participantLabels.singular.toLowerCase()} volume by session.`}
        >
          <ChartContainer
            config={turnoutChartConfig}
            className="h-[280px] w-full"
          >
            <BarChart accessibilityLayer data={analytics.turnout_snapshots}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="title"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => value.slice(0, 10)}
              />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="turnout_percentage"
                fill="var(--color-turnout)"
                radius={10}
                name="Turnout %"
              />
            </BarChart>
          </ChartContainer>
        </TenantSectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <TenantSectionCard
          title="Top voters"
          description={`${participantLabels.plural} with the strongest participation footprint across sessions.`}
        >
          <div className="space-y-3">
            {analytics.top_voters.slice(0, 6).map((voter) => (
              <div
                key={
                  voter.display_identifier || voter.matric_no || voter.full_name
                }
                className="rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {voter.full_name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[
                        formatParticipantIdentifier(
                          voter as Record<string, unknown>,
                          tenant,
                        ),
                        shouldShowTenantParticipantFieldInProfile(
                          tenant,
                          "department",
                        )
                          ? voter.department
                          : null,
                        shouldShowTenantParticipantFieldInProfile(
                          tenant,
                          "college",
                        )
                          ? voter.college
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <Badge>{voter.votes_cast} votes</Badge>
                </div>
              </div>
            ))}
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Recent activity"
          description="The latest admin actions contributing to the operational analytics trail."
        >
          <div className="space-y-3">
            {analytics.recent_activities.slice(0, 6).map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activity.user_name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.action} {activity.resource}
                    </p>
                  </div>
                  <Badge variant="outline">{activity.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </TenantSectionCard>
      </div>
    </div>
  );
}
