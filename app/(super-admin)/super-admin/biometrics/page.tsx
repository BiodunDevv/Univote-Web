"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import {
  usePlatformBiometricMetricsQuery,
  usePlatformVerificationLogsQuery,
} from "@/lib/queries/platform";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
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

const confidenceChartConfig = {
  average_compare_confidence: {
    label: "Average compare confidence",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const failureChartConfig = {
  count: {
    label: "Attempts",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function SuperAdminBiometricsPage() {
  const biometricMetricsQuery = usePlatformBiometricMetricsQuery();
  const verificationLogsQuery = usePlatformVerificationLogsQuery({ limit: 15 });

  if (biometricMetricsQuery.isLoading || verificationLogsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading platform biometric posture...",
          "Compiling cross-university verification metrics...",
          "Preparing recent activity feed...",
        ]}
      />
    );
  }

  const metrics = biometricMetricsQuery.data?.metrics;
  const logs = verificationLogsQuery.data?.logs || [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-1 sm:px-0">
      <TenantPageHeader
        eyebrow="Platform operations"
        icon={<Fingerprint className="h-5 w-5" />}
        title="Biometric monitoring"
        subtitle="Track cross-university biometric health with operational estimates, lockouts, and recent verification activity."
        stats={[
          {
            label: "Pass rate",
            value: `${((metrics?.summary.pass_rate || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "Proxy FAR",
            value: `${((metrics?.summary.proxy_far || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "Proxy FRR",
            value: `${((metrics?.summary.proxy_frr || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "Lockouts",
            value: metrics?.summary.lockout_count?.toLocaleString() || "0",
          },
        ]}
      />

      <TenantMetricGrid columns={4}>
        <TenantMetricCard
          label="Accepted attempts"
          value={metrics?.summary.accepted_attempts?.toLocaleString() || "0"}
          hint="Cross-university accepted verification attempts."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Rejected attempts"
          value={metrics?.summary.rejected_attempts?.toLocaleString() || "0"}
          hint="Attempts blocked by biometric safeguards."
        />
        <TenantMetricCard
          label="Liveness pass rate"
          value={`${((metrics?.summary.liveness_pass_rate || 0) * 100).toFixed(1)}%`}
          hint="Share of completed liveness outcomes that passed."
        />
        <TenantMetricCard
          label="Proxy accuracy"
          value={`${((metrics?.summary.proxy_accuracy || 0) * 100).toFixed(1)}%`}
          hint="Automated operational estimate, not ground-truth accuracy."
          icon={<Lock className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Compare confidence trend"
          description="Average confidence recorded by the active comparison path over time."
        >
          <ChartContainer config={confidenceChartConfig} className="h-[280px] w-full">
            <AreaChart accessibilityLayer data={metrics?.confidence_trend || []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="average_compare_confidence"
                stroke="var(--color-average_compare_confidence)"
                fill="var(--color-average_compare_confidence)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </TenantSectionCard>

        <TenantSectionCard
          title="Failure reasons"
          description="Normalized rejection reasons captured across the live biometric voting flow."
        >
          <ChartContainer config={failureChartConfig} className="h-[280px] w-full">
            <BarChart accessibilityLayer data={metrics?.failure_reasons || []}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="reason"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 14)}
              />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={10} />
            </BarChart>
          </ChartContainer>
        </TenantSectionCard>
      </div>

      <TenantSectionCard
        title="Recent verification activity"
        description="Latest cross-university biometric attempts with tenant, student, election, compare confidence, and lockout posture."
      >
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {log.student?.full_name || "Unknown student"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        log.tenant?.name,
                        log.session?.title,
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
  );
}
