"use client";

import { Activity, BarChart3, Fingerprint, ShieldCheck, Users, Vote } from "lucide-react";
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
  TenantPageHeader,
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
  votes: { label: "Votes", color: "var(--chart-1)" },
} satisfies ChartConfig;

const turnoutChartConfig = {
  turnout: { label: "Turnout %", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { tenant, membership } = useAuthStore();
  const canViewAnalytics = hasAnyTenantPermission(membership, ["analytics.view", "tenant.manage"]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const analyticsQuery = useAdminAnalyticsOverviewQuery();
  const biometricMetricsQuery = useAdminBiometricMetricsQuery();
  const verificationLogsQuery = useAdminVerificationLogsQuery({ limit: 6 });

  if (analyticsQuery.isLoading || biometricMetricsQuery.isLoading || verificationLogsQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading analytics…", "Compiling election metrics…", "Preparing biometric insights…"]} />;
  }

  if (!canViewAnalytics) {
    return <TenantAccessRestricted title="Analytics access restricted" subtitle="Your role does not allow analytics access." />;
  }

  const analytics = analyticsQuery.data;
  const biometricMetrics = biometricMetricsQuery.data?.metrics;
  const verificationLogs = verificationLogsQuery.data?.logs || [];

  if (!analytics) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        {analyticsQuery.error instanceof Error ? analyticsQuery.error.message : "Analytics temporarily unavailable."}
      </div>
    );
  }

  const kpi = [
    { label: `${participantLabels.plural} ready`, value: analytics.overview.total_students.toLocaleString(), icon: Users, hint: `${analytics.overview.students_who_voted.toLocaleString()} voted` },
    { label: "Votes recorded", value: analytics.overview.total_votes.toLocaleString(), icon: Vote, hint: `${analytics.overview.active_sessions} active elections` },
    { label: "Activity events", value: analytics.recent_activities.length.toLocaleString(), icon: Activity, hint: "Recent admin actions" },
    { label: "Proxy accuracy", value: `${((biometricMetrics?.summary.proxy_accuracy || 0) * 100).toFixed(1)}%`, icon: ShieldCheck, hint: "Automated estimate" },
    { label: "Proxy FAR", value: `${((biometricMetrics?.summary.proxy_far || 0) * 100).toFixed(1)}%`, icon: Fingerprint, hint: "From accepted compare outcomes" },
    { label: "Proxy FRR", value: `${((biometricMetrics?.summary.proxy_frr || 0) * 100).toFixed(1)}%`, icon: Fingerprint, hint: "From compare rejections" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Monitoring"
        icon={<BarChart3 className="h-5 w-5" />}
        title="Analytics"
        subtitle="Turnout momentum, election performance, and biometric posture."
        stats={[
          { label: "Participation", value: `${analytics.overview.participation_rate}%` },
          { label: "Avg turnout", value: `${analytics.overview.average_turnout}%` },
          { label: "Pass rate", value: `${((biometricMetrics?.summary.pass_rate || 0) * 100).toFixed(1)}%` },
          { label: "Lockouts", value: biometricMetrics?.summary.lockout_count?.toLocaleString() || "0" },
        ]}
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpi.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-xl border p-4">
            <div className="rounded-md border bg-muted/30 p-1.5">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{item.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Vote trend</p>
          <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
            <AreaChart accessibilityLayer data={analytics.vote_trend}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area type="monotone" dataKey="votes" stroke="var(--color-votes)" fill="var(--color-votes)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Turnout by election</p>
          <ChartContainer config={turnoutChartConfig} className="h-[220px] w-full">
            <BarChart accessibilityLayer data={analytics.turnout_snapshots}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="title" tickLine={false} axisLine={false} tickFormatter={(v) => String(v).slice(0, 12)} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="turnout_percentage" fill="var(--color-turnout)" radius={6} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Biometrics split */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Failure reasons</p>
          {(biometricMetrics?.failure_reasons || []).length > 0 ? (
            <div className="divide-y">
              {biometricMetrics?.failure_reasons.map((entry) => (
                <div key={entry.reason} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-foreground capitalize">{entry.reason.replaceAll("_", " ")}</span>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No failures logged yet.</p>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Recent biometric activity</p>
          {verificationLogs.length > 0 ? (
            <div className="divide-y">
              {verificationLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{log.user_id?.full_name || "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground">{log.session_id?.title || "—"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Badge variant={log.result === "accepted" ? "default" : "secondary"} className="text-[10px]">
                      {log.result}
                    </Badge>
                    {log.lockout_triggered ? <Badge variant="destructive" className="text-[10px]">Lockout</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No biometric activity logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
