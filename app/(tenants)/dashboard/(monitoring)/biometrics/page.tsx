"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import {
  useAdminBiometricMetricsQuery,
  useAdminVerificationLogsQuery,
} from "@/lib/queries/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  TenantAccessRestricted,
  TenantPageHeader,
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
  average_compare_confidence: { label: "Avg compare confidence", color: "var(--chart-1)" },
} satisfies ChartConfig;

const failureChartConfig = {
  count: { label: "Attempts", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function TenantBiometricsPage() {
  const { membership } = useAuthStore();
  const canViewAnalytics = hasAnyTenantPermission(membership, ["analytics.view", "tenant.manage"]);
  const [resultFilter, setResultFilter] = useState("all");

  const biometricMetricsQuery = useAdminBiometricMetricsQuery();
  const verificationLogsQuery = useAdminVerificationLogsQuery({
    limit: 12,
    result: resultFilter === "all" ? undefined : resultFilter,
  });

  if (!canViewAnalytics) {
    return <TenantAccessRestricted title="Biometric monitoring restricted" subtitle="Your role does not allow biometric analytics access." />;
  }

  if (biometricMetricsQuery.isLoading || verificationLogsQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading biometric metrics…", "Preparing verification feed…"]} />;
  }

  const metrics = biometricMetricsQuery.data?.metrics;
  const logs = verificationLogsQuery.data?.logs || [];

  const kpi = [
    { label: "Accepted", value: metrics?.summary.accepted_attempts?.toLocaleString() || "0", icon: ShieldCheck },
    { label: "Rejected", value: metrics?.summary.rejected_attempts?.toLocaleString() || "0", icon: Fingerprint },
    { label: "Liveness pass rate", value: `${((metrics?.summary.liveness_pass_rate || 0) * 100).toFixed(1)}%`, icon: Fingerprint },
    { label: "Proxy accuracy", value: `${((metrics?.summary.proxy_accuracy || 0) * 100).toFixed(1)}%`, icon: Lock },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Monitoring"
        icon={<Fingerprint className="h-5 w-5" />}
        title="Biometrics"
        subtitle="Operational verification posture, lockouts, failure patterns, and compare confidence."
        stats={[
          { label: "Pass rate", value: `${((metrics?.summary.pass_rate || 0) * 100).toFixed(1)}%` },
          { label: "Proxy FAR", value: `${((metrics?.summary.proxy_far || 0) * 100).toFixed(1)}%` },
          { label: "Proxy FRR", value: `${((metrics?.summary.proxy_frr || 0) * 100).toFixed(1)}%` },
          { label: "Lockouts", value: metrics?.summary.lockout_count?.toLocaleString() || "0" },
        ]}
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border p-4">
            <div className="rounded-md border bg-muted/30 p-1.5">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Compare confidence trend</p>
          <ChartContainer config={confidenceChartConfig} className="h-[220px] w-full">
            <AreaChart accessibilityLayer data={metrics?.confidence_trend || []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="average_compare_confidence"
                stroke="var(--color-average_compare_confidence)"
                fill="var(--color-average_compare_confidence)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Failure reasons</p>
          <ChartContainer config={failureChartConfig} className="h-[220px] w-full">
            <BarChart accessibilityLayer data={metrics?.failure_reasons || []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="reason" tickLine={false} axisLine={false} tickFormatter={(v) => String(v).slice(0, 12)} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={6} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium text-foreground">Recent biometric activity</p>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {logs.length > 0 ? (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{log.user_id?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.session_id?.title || "—"} · {log.failure_reason?.replaceAll("_", " ") || log.result}
                    {" · "}Compare {typeof log.compare_confidence === "number" ? `${log.compare_confidence.toFixed(1)}%` : "n/a"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5 pt-0.5">
                  <Badge variant={log.result === "accepted" ? "default" : "secondary"} className="text-[10px]">{log.result}</Badge>
                  {log.lockout_triggered ? <Badge variant="destructive" className="text-[10px]">Lockout</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No verification attempts matched the current filter.</p>
        )}
      </div>
    </div>
  );
}
