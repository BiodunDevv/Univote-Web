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
import { Fingerprint, ShieldCheck } from "lucide-react";
import {
  useAdminBiometricMetricsQuery,
  useAdminVerificationLogsQuery,
  useReviewVerificationLogMutation,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const confidenceChartConfig = {
  average_confidence: {
    label: "Average confidence",
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
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewAction, setReviewAction] = useState<string | null>(null);

  const biometricMetricsQuery = useAdminBiometricMetricsQuery();
  const verificationLogsQuery = useAdminVerificationLogsQuery({
    limit: 12,
    result: resultFilter === "all" ? undefined : resultFilter,
    review_state:
      reviewFilter === "all"
        ? undefined
        : (reviewFilter as "reviewed" | "pending"),
  });
  const reviewVerificationLog = useReviewVerificationLogMutation();

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
          "Compiling verification accuracy...",
          "Preparing review queue...",
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
        subtitle="Review vote-time verification accuracy, investigate failure reasons, and label attempts to improve FAR and FRR quality."
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
          hint="Attempts already labeled genuine or impostor."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Accepted attempts"
          value={metrics?.summary.accepted_attempts?.toLocaleString() || "0"}
          hint="Verification attempts that passed threshold checks."
        />
        <TenantMetricCard
          label="Rejected attempts"
          value={metrics?.summary.rejected_attempts?.toLocaleString() || "0"}
          hint="Attempts blocked by biometric or vote-flow safeguards."
        />
        <TenantMetricCard
          label="Impostor attempts"
          value={
            metrics?.summary.total_impostor_attempts?.toLocaleString() || "0"
          }
          hint="Reviewed attempts marked as impostor activity."
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Confidence trend"
          description="Average confidence across logged verification attempts."
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
          description="Normalized rejection reasons captured in tenant-scoped verification logs."
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
        title="Verification review queue"
        description="Filter verification attempts, inspect results, and label them to keep FAR and FRR accurate."
        action={
          <div className="flex flex-wrap gap-2">
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
            <Select value={reviewFilter} onValueChange={setReviewFilter}>
              <SelectTrigger className="h-10 w-[160px]">
                <SelectValue placeholder="Review state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reviews</SelectItem>
                <SelectItem value="pending">Pending review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {typeof log.confidence_score === "number"
                      ? `Confidence ${log.confidence_score.toFixed(1)}%`
                      : "No confidence score"}{" "}
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
              No verification attempts matched the current filter.
            </div>
          )}
        </div>
      </TenantSectionCard>
    </div>
  );
}
