"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Mail, PhoneCall } from "lucide-react";
import { useState } from "react";
import { usePlatformTenantsQuery } from "@/lib/queries/platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabConfig = {
  pending_payment: {
    label: "Pending Payment",
    description: "Applications waiting on billing activation before platform review can continue.",
    icon: CreditCard,
  },
  pending_approval: {
    label: "Pending Approval",
    description: "Paid tenants ready for provisioning review, approval, and activation.",
    icon: BadgeCheck,
  },
} as const;

export default function PlatformOnboardingPage() {
  const [status, setStatus] = useState<keyof typeof tabConfig>("pending_payment");
  const pendingPaymentQuery = usePlatformTenantsQuery({
    status: "pending_payment",
    limit: 1,
  });
  const pendingApprovalQuery = usePlatformTenantsQuery({
    status: "pending_approval",
    limit: 1,
  });
  const { data, isLoading, error } = usePlatformTenantsQuery({
    status,
    limit: 50,
  });

  const tenants = data?.tenants || [];
  const summary = {
    pending_payment: pendingPaymentQuery.data?.total || 0,
    pending_approval: pendingApprovalQuery.data?.total || 0,
  };

  const ActiveIcon = tabConfig[status].icon;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/40 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Tenant Onboarding</h1>
            <p className="text-sm text-muted-foreground">
              Track organization applications from billing activation through platform approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="secondary">
              {summary.pending_payment} pending payment
            </Badge>
            <Badge variant="outline">
              {summary.pending_approval} pending approval
            </Badge>
          </div>
        </div>
      </section>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <ActiveIcon className="size-4" />
            </div>
            <div>
              <CardTitle>{tabConfig[status].label}</CardTitle>
              <CardDescription>{tabConfig[status].description}</CardDescription>
            </div>
          </div>
          <Tabs value={status} onValueChange={(value) => setStatus(value as keyof typeof tabConfig)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending_payment">Pending payment</TabsTrigger>
              <TabsTrigger value="pending_approval">Pending approval</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading onboarding queue...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-muted-foreground">
              {error.message}
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No tenant applications are currently in this stage.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {tenants.map((tenant) => (
                <Card key={tenant.id} className="border-border/60">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{tenant.name}</CardTitle>
                        <CardDescription>{tenant.slug}</CardDescription>
                      </div>
                      <Badge variant={tenant.status === "pending_approval" ? "default" : "secondary"}>
                        {tenant.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="uppercase">
                        {tenant.plan_code || "pro"}
                      </Badge>
                      <Badge variant="outline">
                        {tenant.onboarding?.institution_type || "organization"}
                      </Badge>
                      <Badge variant="outline">
                        {tenant.onboarding?.student_count_estimate || 0} participants
                      </Badge>
                      <Badge variant="outline">
                        {tenant.onboarding?.admin_count_estimate || 0} admins
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Contact
                        </p>
                        <p className="mt-1 font-medium">
                          {tenant.onboarding?.contact_name || "Not provided"}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5" />
                          <span>{tenant.onboarding?.contact_email || "No email"}</span>
                        </div>
                        {tenant.onboarding?.contact_phone ? (
                          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                            <PhoneCall className="size-3.5" />
                            <span>{tenant.onboarding.contact_phone}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Timing
                        </p>
                        <p className="mt-1 font-medium">
                          Applied {tenant.onboarding?.application_submitted_at
                            ? new Date(tenant.onboarding.application_submitted_at).toLocaleDateString()
                            : "recently"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {tenant.primary_domain || "Subdomain-only deployment for now"}
                        </p>
                      </div>
                    </div>

                    {tenant.onboarding?.notes ? (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                        {tenant.onboarding.notes}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Demo requested: {tenant.onboarding?.demo_requested ? "Yes" : "No"}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/super-admin/tenants/${tenant.id}`}>
                          Review tenant
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
