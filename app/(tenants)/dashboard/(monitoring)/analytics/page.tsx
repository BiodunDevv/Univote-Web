"use client";

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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
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
  const verificationLogsQuery = useAdminVerificationLogsQuery({ limit: 6 });

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
          "Preparing biometric operations insights...",
        ]}
      />
    );
  }

  if (!canViewAnalytics) {
    return (
      <TenantAccessRestricted
        title="Analytics access restricted"
        subtitle="Your university role does not allow analytics access."
      />
    );
  }

  const analytics = analyticsQuery.data;
  const biometricMetrics = biometricMetricsQuery.data?.metrics;
  const verificationLogs = verificationLogsQuery.data?.logs || [];

  if (analyticsQuery.error || !analytics) {
    return (
      <TenantSectionCard
        title="Analytics temporarily unavailable"
        description="The analytics service could not complete this request for your university."
      >
        <p className="text-sm text-muted-foreground">
          {analyticsQuery.error instanceof Error
            ? analyticsQuery.error.message
            : "Retry in a moment. If the problem persists, review recent imports and session activity."}
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
        subtitle="Follow turnout momentum, session performance, and operational biometric posture from one chart-driven workspace."
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
            label: "Pass rate",
            value: `${((biometricMetrics?.summary.pass_rate || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "Lockouts",
            value: biometricMetrics?.summary.lockout_count?.toLocaleString() || "0",
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
          label="Proxy accuracy"
          value={`${((biometricMetrics?.summary.proxy_accuracy || 0) * 100).toFixed(1)}%`}
          hint="Automated operational estimate based on system outcomes."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Proxy FAR"
          value={`${((biometricMetrics?.summary.proxy_far || 0) * 100).toFixed(1)}%`}
          hint="Estimated from accepted compare outcomes, not manual labels."
          icon={<Fingerprint className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Proxy FRR"
          value={`${((biometricMetrics?.summary.proxy_frr || 0) * 100).toFixed(1)}%`}
          hint="Estimated from compare rejections, not human review states."
          icon={<Fingerprint className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TenantSectionCard
          title="Vote trend"
          description="Daily voting volume across the sessions contributing to advanced analytics."
        >
          <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
            <AreaChart accessibilityLayer data={analytics.vote_trend}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
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
          title="Turnout snapshots"
          description="Current turnout posture for the most active session windows."
        >
          <ChartContainer config={turnoutChartConfig} className="h-[280px] w-full">
            <BarChart accessibilityLayer data={analytics.turnout_snapshots}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="title"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 14)}
              />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="turnout_percentage" fill="var(--color-turnout)" radius={10} />
            </BarChart>
          </ChartContainer>
        </TenantSectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <TenantSectionCard
          title="Biometric failure reasons"
          description="Automatic biometric rejection distribution from the live voting flow."
        >
          <div className="space-y-3">
            {(biometricMetrics?.failure_reasons || []).length > 0 ? (
              biometricMetrics?.failure_reasons.map((entry) => (
                <div key={entry.reason} className="flex items-center justify-between rounded-2xl border bg-muted/15 p-3">
                  <span className="text-sm text-foreground">{entry.reason.replaceAll("_", " ")}</span>
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
          title="Recent biometric activity"
          description="Recent liveness and compare decisions from the live voting flow."
        >
          <div className="space-y-3">
            {verificationLogs.length > 0 ? (
              verificationLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {log.user_id?.full_name || "Unknown student"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          log.session_id?.title,
                          log.failure_reason?.replaceAll("_", " ") || log.result,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={log.result === "accepted" ? "default" : "secondary"}>
                        {log.result}
                      </Badge>
                      {log.lockout_triggered ? <Badge variant="destructive">Lockout</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Compare{" "}
                    {typeof log.compare_confidence === "number"
                      ? `${log.compare_confidence.toFixed(1)}%`
                      : "n/a"}{" "}
                    • Liveness{" "}
                    {typeof log.liveness_confidence === "number"
                      ? `${log.liveness_confidence.toFixed(1)}%`
                      : log.liveness_status || "n/a"}{" "}
                    • {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
                No biometric verification activity has been logged yet.
              </div>
            )}
          </div>
        </TenantSectionCard>
      </div>
    </div>
  );
}
