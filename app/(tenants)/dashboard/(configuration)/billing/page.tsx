"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminBillingInvoicesQuery,
  useAdminBillingSummaryQuery,
  useBillingCheckoutMutation,
  useCancelBillingChangeMutation,
} from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantPageHeader, TenantSectionCard } from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "PPP");
}

const entitlementLabels: Array<{
  key:
    | "custom_terminology"
    | "custom_identity_policy"
    | "custom_participant_structure"
    | "advanced_analytics"
    | "advanced_reports"
    | "realtime_support"
    | "push_notifications"
    | "custom_branding"
    | "face_verification";
  label: string;
}> = [
  { key: "custom_terminology", label: "Custom terminology" },
  { key: "custom_identity_policy", label: "Custom identity" },
  { key: "custom_participant_structure", label: "Custom structure" },
  { key: "advanced_analytics", label: "Advanced analytics" },
  { key: "advanced_reports", label: "Advanced reports" },
  { key: "realtime_support", label: "Realtime support" },
  { key: "push_notifications", label: "Push notifications" },
  { key: "custom_branding", label: "Custom branding" },
  { key: "face_verification", label: "Face verification" },
];

export default function BillingPage() {
  const { tenant: authTenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(authTenant);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("plans");
  const summaryQuery = useAdminBillingSummaryQuery();
  const invoicesQuery = useAdminBillingInvoicesQuery({ page: 1, limit: 20 });
  const checkoutMutation = useBillingCheckoutMutation();
  const cancelMutation = useCancelBillingChangeMutation();

  const summary = summaryQuery.data;
  const plans = summary?.plans || [];
  const tenant = summary?.tenant;
  const billing = summary?.billing;
  const capabilities = summary?.capabilities;
  const invoices = invoicesQuery.data?.invoices || billing?.invoices || [];
  const pendingInvoice =
    invoices.find(
      (invoice) =>
        invoice.status === "pending" && Boolean(invoice.provider_checkout_url),
    ) || null;
  const restrictionReason = searchParams.get("reason");

  const handlePlanChange = async (planCode: string) => {
    try {
      const result = await checkoutMutation.mutateAsync(planCode);
      if (result.checkout_url) {
        toast.success("Redirecting to secure payment");
        window.location.assign(result.checkout_url);
        return;
      }
      toast.success(result.message);
      setActiveTab("overview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change plan");
    }
  };

  const handleCancelScheduledChange = async () => {
    try {
      const result = await cancelMutation.mutateAsync();
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel scheduled change",
      );
    }
  };

  if (summaryQuery.isLoading && !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TenantPageHeader
        eyebrow="Tenant billing"
        icon={<CreditCard className="h-5 w-5" />}
        title="Billing & Plan"
        subtitle="Upgrade instantly, schedule downgrades for the end of the current cycle, and review invoice history for the active tenant."
        stats={[
          {
            label: "Current plan",
            value: billing?.current_plan.name || "Unknown",
          },
          {
            label: "Subscription",
            value: tenant?.subscription_status || "unknown",
          },
          {
            label: "Cycle end",
            value: billing?.current_period_end
              ? formatDate(billing.current_period_end)
              : "Not set",
          },
          {
            label: "Pending invoice",
            value: pendingInvoice ? pendingInvoice.invoice_number : "None",
          },
        ]}
      />

      {restrictionReason ? (
        <Card className="border-amber-300/60 bg-amber-50/70 shadow-none dark:bg-amber-950/20">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Tenant access is currently restricted by subscription status. Billing and support
            remain available while the tenant is in a restricted state.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-2xl">
              {billing?.current_plan.name || "Unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Subscription</span>
              <Badge variant="secondary">{tenant?.subscription_status || "unknown"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge variant="outline">{tenant?.status || "unknown"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Price</span>
              <span className="font-medium text-foreground">
                {billing?.current_plan
                  ? formatMoney(billing.current_plan.monthly_price_ngn)
                  : "--"}
                <span className="ml-1 text-xs text-muted-foreground">/ month</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardDescription>Current cycle</CardDescription>
            <CardTitle className="text-2xl">{billing?.billing_cycle || "monthly"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Start</span>
              <span className="font-medium text-foreground">
                {formatDate(billing?.current_period_start)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>End</span>
              <span className="font-medium text-foreground">
                {formatDate(billing?.current_period_end)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last payment</span>
              <span className="font-medium text-foreground">
                {formatDate(billing?.last_payment_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardDescription>Scheduled change</CardDescription>
            <CardTitle className="text-2xl">
              {billing?.scheduled_change?.name || "None"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {billing?.scheduled_change ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Effective</span>
                  <span className="font-medium text-foreground">
                    {formatDate(billing.scheduled_change.effective_at)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCancelScheduledChange}
                  disabled={cancelMutation.isPending}
                >
                  Cancel scheduled downgrade
                </Button>
              </>
            ) : (
              <p>No pending upgrade or downgrade is scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="overview">Plan limits</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {pendingInvoice ? (
          <Card className="border-border/70 bg-amber-50/60 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardDescription>Pending payment</CardDescription>
              <CardTitle className="text-xl">
                Complete checkout for {pendingInvoice.invoice_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Finish payment to apply the latest billing change and sync the tenant plan.
              </div>
              {pendingInvoice.provider_checkout_url ? (
                <Button asChild>
                  <a href={pendingInvoice.provider_checkout_url} target="_self" rel="noreferrer">
                    Continue payment
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.code === tenant?.plan_code;
              const isUpgrade =
                billing?.current_plan && plan.rank > billing.current_plan.rank;

              return (
                <Card key={plan.code} className="border-border/70">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.support_sla} support SLA</CardDescription>
                      </div>
                      {isCurrent ? <Badge>Current</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-semibold">
                      {formatMoney(plan.monthly_price_ngn)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / month
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Admins</span>
                        <span className="font-medium text-foreground">{plan.limits.admins}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{participantLabels.plural}</span>
                        <span className="font-medium text-foreground">{plan.limits.students}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active sessions</span>
                        <span className="font-medium text-foreground">
                          {plan.limits.active_sessions}
                        </span>
                      </div>
                    </div>
                  <div className="space-y-2 text-sm">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                          {isUpgrade ? (
                            <ArrowUpCircle className="size-4 text-emerald-600" />
                          ) : (
                            <ArrowDownCircle className="size-4 text-slate-500" />
                          )}
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 rounded-xl border p-3">
                      <p className="text-xs font-medium text-foreground">
                        Included entitlements
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entitlementLabels.map((entitlement) => (
                          <Badge
                            key={entitlement.key}
                            variant={
                              plan.entitlements?.[entitlement.key]
                                ? "default"
                                : "outline"
                            }
                            className="text-[11px]"
                          >
                            {entitlement.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || checkoutMutation.isPending}
                      onClick={() => handlePlanChange(plan.code)}
                    >
                      {isCurrent
                        ? "Current plan"
                        : isUpgrade
                          ? "Upgrade now"
                          : "Downgrade at period end"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Usage against plan limits</CardTitle>
                <CardDescription>
                  Live capacity for the active tenant subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admin seats</span>
                    <span className="text-lg font-semibold">
                      {capabilities?.usage.admins.used ?? 0}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / {capabilities?.usage.admins.limit ?? "--"}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {capabilities?.usage.admins.remaining ?? 0} remaining.
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {participantLabels.singular} records
                    </span>
                    <span className="text-lg font-semibold">
                      {capabilities?.usage.students.used ?? 0}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / {capabilities?.usage.students.limit ?? "--"}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {capabilities?.usage.students.remaining ?? 0} remaining.
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open session capacity</span>
                    <span className="text-lg font-semibold">
                      {capabilities?.usage.active_sessions.used ?? 0}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / {capabilities?.usage.active_sessions.limit ?? "--"}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upcoming and active sessions both count toward this limit.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Included capabilities</CardTitle>
                <CardDescription>
                  Active feature gates for the current plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {entitlementLabels.map((entitlement) => (
                  <div
                    key={entitlement.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {entitlement.label}
                    </span>
                    <Badge
                      variant={
                        capabilities?.features[entitlement.key]
                          ? "default"
                          : "secondary"
                      }
                    >
                      {capabilities?.features[entitlement.key]
                        ? "Enabled"
                        : "Upgrade required"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Plan summary</CardTitle>
                <CardDescription>
                  Included entitlements for {billing?.current_plan.name || "the active plan"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Support SLA</span>
                  <span className="font-medium text-foreground">
                    {billing?.current_plan.support_sla || "--"}
                  </span>
                </div>
                {billing?.current_plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-border/70">
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-5" />
                Invoice history
              </CardTitle>
              <CardDescription>
                Payment records and scheduled renewals for the current tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(invoice.issued_at)}
                        </div>
                      </TableCell>
                      <TableCell className="uppercase">{invoice.plan_code}</TableCell>
                      <TableCell>{formatMoney(invoice.amount_ngn)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.period_start && invoice.period_end
                          ? `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`
                          : "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "paid" ? "secondary" : "outline"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {invoice.payment_reference || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No invoices recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex flex-col gap-3 py-6 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Upgrade requests apply immediately. Downgrades are scheduled for the end of the
            current paid cycle.
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            Current period ends on {formatDate(billing?.current_period_end)}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
