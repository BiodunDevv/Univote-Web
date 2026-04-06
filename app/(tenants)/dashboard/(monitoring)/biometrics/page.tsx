"use client";

import { useState } from "react";
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
  useAdminBiometricMetricsQuery,
  useAdminVerificationLogsQuery,
} from "@/lib/queries/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  TenantAccessRestricted,
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const confidenceChartConfig = {
  average_compare_confidence: {
    label: "Average compare confidence",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const failureChartConfig = {
  count: {
    label: "Attempts",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function TenantBiometricsPage() {
  const { membership } = useAuthStore();
  const canViewAnalytics = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
  ]);
  const [resultFilter, setResultFilter] = useState("all");

  const biometricMetricsQuery = useAdminBiometricMetricsQuery();
  const verificationLogsQuery = useAdminVerificationLogsQuery({
    limit: 12,
    result: resultFilter === "all" ? undefined : resultFilter,
  });

  if (!canViewAnalytics) {
    return (
      <TenantAccessRestricted
        title="Biometric monitoring restricted"
        subtitle="Your university role does not allow access to biometric analytics."
      />
    );
  }

  if (biometricMetricsQuery.isLoading || verificationLogsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading biometric metrics...",
          "Compiling operational verification posture...",
          "Preparing biometric activity feed...",
        ]}
      />
    );
  }

  const metrics = biometricMetricsQuery.data?.metrics;
  const logs = verificationLogsQuery.data?.logs || [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-2">
      <TenantPageHeader
        eyebrow="Tenant monitoring"
        icon={<Fingerprint className="h-5 w-5" />}
        title="Biometric verification"
        subtitle="Track operational biometric performance, lockouts, failure patterns, and compare confidence without manual genuine or impostor review."
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
          hint="Verification attempts accepted by the live voting safeguards."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Rejected attempts"
          value={metrics?.summary.rejected_attempts?.toLocaleString() || "0"}
          hint="Attempts rejected by liveness, compare, or other biometric checks."
        />
        <TenantMetricCard
          label="Liveness pass rate"
          value={`${((metrics?.summary.liveness_pass_rate || 0) * 100).toFixed(1)}%`}
          hint="Share of completed liveness outcomes that passed the configured threshold."
        />
        <TenantMetricCard
          label="Proxy accuracy"
          value={`${((metrics?.summary.proxy_accuracy || 0) * 100).toFixed(1)}%`}
          hint="Operational estimate based on system outcomes, not ground-truth labels."
          icon={<Lock className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Compare confidence trend"
          description="Average face compare confidence across logged verification attempts."
        >
          <ChartContainer
            config={confidenceChartConfig}
            className="h-[280px] w-full"
          >
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
          description="Normalized biometric rejection reasons captured in tenant-scoped verification logs."
        >
          <ChartContainer
            config={failureChartConfig}
            className="h-[280px] w-full"
          >
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
        title="Recent biometric activity"
        description="Inspect live vote verification outcomes, compare confidence, and lockout posture."
        action={
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => (
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
                    {log.lockout_triggered ? (
                      <Badge variant="destructive">Lockout triggered</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>
                    Compare:{" "}
                    {typeof log.compare_confidence === "number"
                      ? `${log.compare_confidence.toFixed(1)}%`
                      : "n/a"}
                  </span>
                  <span>
                    Liveness:{" "}
                    {typeof log.liveness_confidence === "number"
                      ? `${log.liveness_confidence.toFixed(1)}%`
                      : log.liveness_status || "n/a"}
                  </span>
                  <span>Fail streak: {log.fail_streak || 0}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
              No verification attempts matched the current filter.
            </div>
          )}
        </div>
      </TenantSectionCard>
    </div>
  );
}
