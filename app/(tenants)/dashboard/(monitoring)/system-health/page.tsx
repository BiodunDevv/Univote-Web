"use client";

import { Activity } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  useAdminDatabaseStatsQuery,
  useAdminSystemHealthQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

const systemHealthChartConfig = {
  count: {
    label: "Records",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function SystemHealthPage() {
  const { tenant, membership } = useAuthStore();
  const canViewSystemHealth = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
  ]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const healthQuery = useAdminSystemHealthQuery();
  const databaseQuery = useAdminDatabaseStatsQuery();

  if (!canViewSystemHealth) {
    return (
      <TenantAccessRestricted
        title="System health access restricted"
        subtitle="Your university role does not allow operational monitoring access."
      />
    );
  }

  if (healthQuery.isLoading || databaseQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Checking system health...",
          "Inspecting database statistics...",
          "Preparing status checks...",
        ]}
      />
    );
  }

  const health = healthQuery.data?.health;
  const database = databaseQuery.data?.database_statistics;

  if (!health || !database) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          System health data is unavailable right now.
        </CardContent>
      </Card>
    );
  }

  const collectionTotals = [
    { label: participantLabels.plural, count: database.students.total },
    { label: "Votes", count: database.votes.total },
    { label: "Sessions", count: database.sessions.total },
    { label: "Admins", count: database.admins.total },
    { label: "Colleges", count: database.colleges },
    { label: "Audit", count: database.audit_logs },
  ];

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant monitoring"
        icon={<Activity className="h-5 w-5" />}
        title="System Health"
        subtitle="Track infrastructure readiness, dependency status, and the live database footprint from one operational health view."
        stats={[
          { label: "Platform status", value: health.status },
          {
            label: "Collections",
            value: collectionTotals.length.toLocaleString(),
          },
          {
            label: "Votes",
            value: database.votes.total.toLocaleString(),
          },
          {
            label: participantLabels.plural,
            value: database.students.total.toLocaleString(),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TenantSectionCard
          title="Collection footprint"
          description="Live totals for the collections that matter most to tenant operations."
        >
          <ChartContainer
            config={systemHealthChartConfig}
            className="h-[280px] w-full"
          >
            <BarChart accessibilityLayer data={collectionTotals}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={10} />
            </BarChart>
          </ChartContainer>
        </TenantSectionCard>

        <TenantSectionCard
          title="Dependency checks"
          description="Detailed readiness of the health probes currently backing the tenant environment."
          contentClassName="space-y-3"
        >
          {Object.entries(health.checks).map(([key, value]) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <div>
                <p className="text-sm font-semibold capitalize text-foreground">
                  {key}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {value.message}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {value.status.replaceAll("_", " ")}
              </Badge>
            </div>
          ))}
        </TenantSectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TenantSectionCard
          title="Session distribution"
          description="How session records are currently split across lifecycle states."
          contentClassName="space-y-3"
        >
          {database.sessions.by_status.map((entry) => (
            <div
              key={`session-${entry._id}`}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                Session status: {entry._id}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.count.toLocaleString()} records
              </p>
            </div>
          ))}
        </TenantSectionCard>

        <TenantSectionCard
          title="Vote distribution"
          description="How vote documents are currently distributed across backend statuses."
          contentClassName="space-y-3"
        >
          {database.votes.by_status.map((entry) => (
            <div
              key={`vote-${entry._id}`}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                Vote status: {entry._id}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.count.toLocaleString()} records
              </p>
            </div>
          ))}
        </TenantSectionCard>
      </div>
    </div>
  );
}
