"use client";

import Link from "next/link";
import { Building2, Clock3, ShieldAlert, Users } from "lucide-react";
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
  usePlatformOverviewQuery,
  usePlatformTenantsQuery,
} from "@/lib/queries/platform";

const metricCards = [
  { key: "total_tenants", label: "Total Tenants", icon: Building2 },
  { key: "active_tenants", label: "Active Tenants", icon: Users },
  { key: "grace_period_tenants", label: "Grace Period", icon: Clock3 },
  { key: "suspended_tenants", label: "Suspended", icon: ShieldAlert },
] as const;

export default function SuperAdminOverviewPage() {
  const overviewQuery = usePlatformOverviewQuery();
  const tenantsQuery = usePlatformTenantsQuery({ limit: 6 });

  if (overviewQuery.isLoading || tenantsQuery.isLoading) {
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-1 sm:px-0">
      <TenantPageHeader
        eyebrow="Platform operations"
        icon={<Building2 className="h-5 w-5" />}
        title="Platform overview"
        subtitle="Monitor tenant lifecycle, active admin coverage, support demand, and the operating posture of the entire Univote platform."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/super-admin/tenants">Open tenant directory</Link>
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
          { label: "Tenants", value: overview?.total_tenants ?? "--" },
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
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const value =
            overview?.[metric.key as keyof NonNullable<typeof overview>] ??
            "--";

          return (
            <TenantMetricCard
              key={metric.key}
              label={metric.label}
              value={typeof value === "number" ? value.toLocaleString() : value}
              icon={<Icon className="h-4 w-4" />}
            />
          );
        })}
      </TenantMetricGrid>

      <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <AdminChatOverviewCard supportPath="/super-admin/support" showTenant />
        <TenantSectionCard
          title="Newest tenants"
          description="Inspect access posture, onboarding progress, and open each tenant for deeper operational review."
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
                      No tenants created yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TenantSectionCard>
      </div>
    </div>
  );
}
