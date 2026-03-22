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
import { Fingerprint, ShieldCheck } from "lucide-react";
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
  average_confidence: {
    label: "Average confidence",
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
        subtitle="Track verification accuracy, failure reasons, and review posture across all university workspaces."
        stats={[
          {
            label: "Accuracy",
            value: `${((metrics?.summary.accuracy || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "FAR",
            value: `${((metrics?.summary.far || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "FRR",
            value: `${((metrics?.summary.frr || 0) * 100).toFixed(1)}%`,
          },
          {
            label: "Pending review",
            value: metrics?.summary.unlabeled_attempts?.toLocaleString() || "0",
          },
        ]}
      />

      <TenantMetricGrid columns={4}>
        <TenantMetricCard
          label="Reviewed attempts"
          value={metrics?.summary.reviewed_attempts?.toLocaleString() || "0"}
          hint="Attempts already labeled across all universities."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Accepted attempts"
          value={metrics?.summary.accepted_attempts?.toLocaleString() || "0"}
          hint="Cross-university accepted verification attempts."
        />
        <TenantMetricCard
          label="Rejected attempts"
          value={metrics?.summary.rejected_attempts?.toLocaleString() || "0"}
          hint="Attempts blocked by verification safeguards."
        />
        <TenantMetricCard
          label="Impostor attempts"
          value={
            metrics?.summary.total_impostor_attempts?.toLocaleString() || "0"
          }
          hint="Reviewed impostor attempts across the platform."
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Confidence trend"
          description="Average confidence recorded by the active verification provider over time."
        >
          <ChartContainer
            config={confidenceChartConfig}
            className="h-[280px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={metrics?.confidence_trend || []}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="average_confidence"
                stroke="var(--color-average_confidence)"
                fill="var(--color-average_confidence)"
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
        title="Recent verification activity"
        description="Latest cross-university biometric attempts with tenant, student, session, and review posture."
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
                    <Badge
                      variant={log.result === "accepted" ? "default" : "secondary"}
                    >
                      {log.result}
                    </Badge>
                    <Badge variant="outline">
                      {log.is_genuine_attempt === null
                        ? "Pending review"
                        : log.is_genuine_attempt
                          ? "Genuine"
                          : "Impostor"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {typeof log.confidence_score === "number"
                    ? `Confidence ${log.confidence_score.toFixed(1)}%`
                    : "No confidence score"}{" "}
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
