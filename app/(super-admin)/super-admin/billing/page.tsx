"use client";

import { format } from "date-fns";
import { BadgeDollarSign, CalendarClock, Coins, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlatformBillingOverviewQuery } from "@/lib/queries/platform";

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

export default function PlatformBillingPage() {
  const billingQuery = usePlatformBillingOverviewQuery();
  const data = billingQuery.data;

  const metrics = [
    {
      label: "Recurring revenue",
      value: data ? formatMoney(data.metrics.monthly_recurring_revenue_ngn) : "--",
      icon: Wallet,
    },
    {
      label: "Active subscriptions",
      value: data?.metrics.active_subscriptions ?? "--",
      icon: BadgeDollarSign,
    },
    {
      label: "Scheduled downgrades",
      value: data?.metrics.scheduled_downgrades ?? "--",
      icon: TrendingDown,
    },
    {
      label: "Tenants in billing",
      value: data?.metrics.total_tenants ?? "--",
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Platform Billing</h1>
        <p className="text-sm text-muted-foreground">
          Review revenue posture, active subscriptions, and tenants with scheduled
          plan changes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Tenant billing watchlist</CardTitle>
            <CardDescription>
              Track plan posture, renewal dates, and scheduled downgrades across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Scheduled change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.tenants || []).map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                    </TableCell>
                    <TableCell className="uppercase">{tenant.plan_code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tenant.subscription_status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(tenant.current_period_end)}</TableCell>
                    <TableCell>
                      {tenant.scheduled_plan_code ? (
                        <div className="space-y-1 text-sm">
                          <div className="font-medium uppercase">
                            {tenant.scheduled_plan_code.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(tenant.scheduled_plan_effective_at)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Recent paid invoices</CardTitle>
            <CardDescription>
              Latest successful charges recorded by the billing pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.invoices || []).map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl border border-border/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(invoice.issued_at)}
                    </p>
                  </div>
                  <Badge variant="secondary">{invoice.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="uppercase text-muted-foreground">{invoice.plan_code}</span>
                  <span className="font-medium">{formatMoney(invoice.amount_ngn)}</span>
                </div>
              </div>
            ))}
            {data?.invoices?.length ? null : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No billing activity has been recorded yet.
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
              <CalendarClock className="size-4" />
              Scheduled downgrades take effect at the current period end and renew on the
              target plan.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
