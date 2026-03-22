"use client";

import { useState } from "react";
import {
  BarChart3,
  Activity,
  Users,
  Vote,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAdminAnalyticsOverviewQuery,
  useAdminBiometricMetricsQuery,
  useAdminVerificationLogsQuery,
  useReviewVerificationLogMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
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
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

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
  const { tenant, membership } = useAuthStore();
  const canViewAnalytics = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
  ]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const analyticsQuery = useAdminAnalyticsOverviewQuery();
  const biometricMetricsQuery = useAdminBiometricMetricsQuery();
  const verificationLogsQuery = useAdminVerificationLogsQuery({
    limit: 6,
  });
  const reviewVerificationLog = useReviewVerificationLogMutation();
  const [reviewAction, setReviewAction] = useState<string | null>(null);

  if (!canViewAnalytics) {
    return (
      <TenantAccessRestricted
        title="Analytics access restricted"
        subtitle="Your university role does not allow analytics access."
      />
    );
  }

  if (
    analyticsQuery.isLoading ||
    biometricMetricsQuery.isLoading ||
    verificationLogsQuery.isLoading
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

  const analytics = analyticsQuery.data;
  const biometricMetrics = biometricMetricsQuery.data?.metrics;
  const verificationLogs = verificationLogsQuery.data?.logs || [];

  if (analyticsQuery.error) {
    return (
      <TenantSectionCard
        title="Analytics temporarily unavailable"
        description="The analytics service could not complete this request for your university."
      >
        <p className="text-sm text-muted-foreground">
          {analyticsQuery.error instanceof Error
            ? analyticsQuery.error.message
            : "Retry in a moment. If the problem persists, review recent data imports and session activity."}
        </p>
      </TenantSectionCard>
    );
  }

  if (!analytics) {
    return (
      <TenantSectionCard
        title="Analytics are getting started"
        description="This university does not have enough recent activity to populate the advanced analytics overview yet."
      >
        <p className="text-sm text-muted-foreground">
          Once sessions, votes, and operational activity accumulate, the trend
          charts and turnout summaries will appear here automatically.
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

      <TenantMetricGrid columns={3}>
        <TenantMetricCard
          label="Biometric accuracy"
          value={`${((biometricMetrics?.summary.accuracy || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.reviewed_attempts || 0} reviewed attempts used for evaluation.`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="False accept rate"
          value={`${((biometricMetrics?.summary.far || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.false_accepts || 0} false accepts across ${biometricMetrics?.summary.total_impostor_attempts || 0} reviewed impostor attempts.`}
          icon={<Fingerprint className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="False reject rate"
          value={`${((biometricMetrics?.summary.frr || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.false_rejects || 0} false rejects across ${biometricMetrics?.summary.total_genuine_attempts || 0} reviewed genuine attempts.`}
          icon={<Fingerprint className="h-4 w-4" />}
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

      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <TenantSectionCard
          title="Biometric failure reasons"
          description="Recent rejection reasons captured during vote-time face verification and voting safeguards."
        >
          <div className="space-y-3">
            {(biometricMetrics?.failure_reasons || []).length > 0 ? (
              biometricMetrics?.failure_reasons.map((entry) => (
                <div
                  key={entry.reason}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {entry.reason.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Captured in verification logs and available for review.
                    </p>
                  </div>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
                No biometric failure reasons have been logged yet.
              </div>
            )}
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Recent verification reviews"
          description="Review vote-time biometric attempts, then mark them as genuine or impostor to improve FAR and FRR accuracy."
        >
          <div className="space-y-3">
            {verificationLogs.length > 0 ? (
              verificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {log.user_id?.full_name || "Unknown student"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          log.session_id?.title,
                          log.failure_reason?.replaceAll("_", " ") ||
                            log.result,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={log.result === "accepted" ? "default" : "secondary"}>
                        {log.result}
                      </Badge>
                      <Badge variant="outline">
                        {typeof log.confidence_score === "number"
                          ? `${log.confidence_score.toFixed(1)}%`
                          : "No confidence"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {log.is_genuine_attempt === null
                        ? "Pending review"
                        : log.is_genuine_attempt
                          ? "Reviewed as genuine attempt"
                          : "Reviewed as impostor attempt"}{" "}
                      • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewAction === log.id}
                        onClick={async () => {
                          setReviewAction(log.id);
                          try {
                            await reviewVerificationLog.mutateAsync({
                              id: log.id,
                              is_genuine_attempt: true,
                            });
                          } finally {
                            setReviewAction(null);
                          }
                        }}
                      >
                        {reviewAction === log.id ? "Saving..." : "Mark genuine"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={reviewAction === log.id}
                        onClick={async () => {
                          setReviewAction(log.id);
                          try {
                            await reviewVerificationLog.mutateAsync({
                              id: log.id,
                              is_genuine_attempt: false,
                            });
                          } finally {
                            setReviewAction(null);
                          }
                        }}
                      >
                        {reviewAction === log.id ? "Saving..." : "Mark impostor"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
                Verification attempts will appear here after students begin face-verified voting.
              </div>
            )}
          </div>
        </TenantSectionCard>
      </div>
    </div>
  );
}
