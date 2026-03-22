"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Fingerprint } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { AdminChatOverviewCard } from "@/components/support/admin-chat-overview-card";
import {
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  usePlatformOverviewQuery,
  usePlatformBiometricMetricsQuery,
  usePlatformVerificationLogsQuery,
  usePlatformTenantsQuery,
} from "@/lib/queries/platform";

export default function SuperAdminOverviewPage() {
  const overviewQuery = usePlatformOverviewQuery();
  const tenantsQuery = usePlatformTenantsQuery({ limit: 6 });
  const biometricMetricsQuery = usePlatformBiometricMetricsQuery();
  const verificationLogsQuery = usePlatformVerificationLogsQuery({ limit: 5 });

  if (
    overviewQuery.isLoading ||
    tenantsQuery.isLoading ||
    biometricMetricsQuery.isLoading ||
    verificationLogsQuery.isLoading
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading platform overview...",
          "Checking tenant lifecycle health...",
          "Preparing operations and support insights...",
        ]}
      />
    );
  }

  if (overviewQuery.error || tenantsQuery.error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-border/70 bg-card p-3 text-sm text-muted-foreground">
          {overviewQuery.error?.message ||
            tenantsQuery.error?.message ||
            "Platform overview is unavailable right now."}
        </div>
      </div>
    );
  }

  const overview = overviewQuery.data?.overview;
  const tenants = tenantsQuery.data?.tenants || [];
  const biometricMetrics = biometricMetricsQuery.data?.metrics;
  const verificationLogs = verificationLogsQuery.data?.logs || [];
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-1 sm:px-0">
      <TenantPageHeader
        eyebrow="Platform operations"
        icon={<Building2 className="h-5 w-5" />}
        title="Platform overview"
        subtitle="Monitor university lifecycle, active admin coverage, support demand, and the operating posture of the entire Univote platform."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/super-admin/tenants">Open university directory</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/super-admin/onboarding">
                Review onboarding queue
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/super-admin/testimonials">
                Moderate testimonials
              </Link>
            </Button>
          </div>
        }
        stats={[
          { label: "Universities", value: overview?.total_tenants ?? "--" },
          { label: "Active", value: overview?.active_tenants ?? "--" },
          {
            label: "Grace period",
            value: overview?.grace_period_tenants ?? "--",
          },
          {
            label: "Admin seats",
            value: overview?.active_tenant_admins ?? "--",
          },
        ]}
      />

      <TenantMetricGrid columns={4}>
        <TenantMetricCard
          label="Biometric accuracy"
          value={`${((biometricMetrics?.summary.accuracy || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.reviewed_attempts || 0} reviewed attempts across all universities.`}
        />
        <TenantMetricCard
          label="False accept rate"
          value={`${((biometricMetrics?.summary.far || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.false_accepts || 0} false accepts.`}
        />
        <TenantMetricCard
          label="False reject rate"
          value={`${((biometricMetrics?.summary.frr || 0) * 100).toFixed(1)}%`}
          hint={`${biometricMetrics?.summary.false_rejects || 0} false rejects.`}
        />
        <TenantMetricCard
          label="Pending reviews"
          value={(biometricMetrics?.summary.unlabeled_attempts || 0).toLocaleString()}
          hint="Verification attempts waiting for admin labeling."
        />
      </TenantMetricGrid>

      <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <AdminChatOverviewCard supportPath="/super-admin/support" showTenant />
        <TenantSectionCard
          title="Newest universities"
          description="Inspect access posture, onboarding progress, and open each university for deeper operational review."
          contentClassName="px-0 pb-2 pt-0 sm:px-3 sm:pb-3"
        >
          <div className="w-full overflow-x-auto px-3 sm:px-0">
            <Table className="min-w-xl">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {tenant.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tenant.status || "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" asChild>
                        <Link href={`/super-admin/tenants/${tenant.id}`}>
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No universities created yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TenantSectionCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Verification confidence trend"
          description="Average confidence across recent biometric verification activity."
        >
          <ChartContainer
            config={confidenceChartConfig}
            className="h-[280px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={biometricMetrics?.confidence_trend || []}
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
          title="Failure reason distribution"
          description="Normalized verification rejection reasons observed across universities."
        >
          <ChartContainer
            config={failureChartConfig}
            className="h-[280px] w-full"
          >
            <BarChart accessibilityLayer data={biometricMetrics?.failure_reasons || []}>
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
        title="Recent biometric verification activity"
        description="Cross-university verification attempts, review state, and failure reasons from the live voting flow."
        action={
          <Button variant="outline" asChild>
            <Link href="/super-admin/biometrics">
              <Fingerprint className="mr-2 h-4 w-4" />
              Open biometric monitoring
            </Link>
          </Button>
        }
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
