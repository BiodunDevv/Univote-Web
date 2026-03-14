"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  usePlatformTenantBillingQuery,
  usePlatformTenantQuery,
  useUpdatePlatformTenantMutation,
} from "@/lib/queries/platform";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "PPP");
}

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;
  const tenantQuery = usePlatformTenantQuery(tenantId);
  const billingQuery = usePlatformTenantBillingQuery(tenantId);
  const updateTenant = useUpdatePlatformTenantMutation(tenantId);

  const [formData, setFormData] = useState({
    name: "",
    primary_domain: "",
    contact_name: "",
    contact_email: "",
    support_email: "",
    plan_code: "pro" as "pro" | "pro_plus" | "enterprise",
    status: "draft" as
      | "draft"
      | "pending_payment"
      | "pending_approval"
      | "active"
      | "suspended",
    subscription_status: "trial" as
      | "trial"
      | "active"
      | "grace"
      | "expired"
      | "suspended",
    is_active: true,
  });

  useEffect(() => {
    const tenant = tenantQuery.data?.tenant;
    if (!tenant) return;

    setFormData({
      name: tenant.name || "",
      primary_domain: tenant.primary_domain || "",
      contact_name: tenant.onboarding?.contact_name || "",
      contact_email: tenant.onboarding?.contact_email || "",
      support_email: tenant.branding?.support_email || "",
      plan_code: (tenant.plan_code || "pro") as "pro" | "pro_plus" | "enterprise",
      status: (tenant.status || "draft") as
        | "draft"
        | "pending_payment"
        | "pending_approval"
        | "active"
        | "suspended",
      subscription_status: (tenant.subscription_status || "trial") as
        | "trial"
        | "active"
        | "grace"
        | "expired"
        | "suspended",
      is_active: tenant.is_active,
    });
  }, [tenantQuery.data?.tenant]);

  const isLoading = tenantQuery.isLoading || billingQuery.isLoading;
  const errorMessage = tenantQuery.error?.message || billingQuery.error?.message;
  const tenant = tenantQuery.data?.tenant;
  const stats = tenantQuery.data?.stats;
  const team = tenantQuery.data?.team || [];
  const billing = billingQuery.data?.billing;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await updateTenant.mutateAsync({
        ...formData,
        primary_domain: formData.primary_domain || "",
        contact_name: formData.contact_name || "",
        contact_email: formData.contact_email || "",
        support_email: formData.support_email || "",
      });

      toast.success("Tenant updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update tenant");
    }
  };

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading tenant workspace...",
          "Pulling billing posture...",
          "Preparing management controls...",
        ]}
      />
    );
  }

  if (!tenant || !stats || !billing) {
    return (
      <Card className="border-destructive/40 shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {errorMessage || "Tenant detail is unavailable right now."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{tenant.slug}</Badge>
              <Badge variant="secondary">{tenant.subscription_status}</Badge>
              <Badge variant="outline">{tenant.status}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              Manage tenant identity, subscription posture, operational status, and access coverage.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/super-admin/tenants">Back to tenants</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Admins", value: stats.admins.total },
          { label: "Participants", value: stats.students.total },
          { label: "Colleges", value: stats.colleges },
          { label: "Sessions", value: stats.sessions.total },
          { label: "Candidates", value: stats.candidates },
          { label: "Votes", value: stats.votes.total },
        ].map((item) => (
          <Card key={item.label} className="border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>Tenant configuration</CardTitle>
            <CardDescription>
              Update the tenant’s domain, billing posture, and activation lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Tenant name</Label>
                  <Input
                    id="tenant-name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-domain">Primary domain</Label>
                  <Input
                    id="tenant-domain"
                    value={formData.primary_domain}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        primary_domain: event.target.value,
                      }))
                    }
                    placeholder="subdomain.univote.app"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Contact name</Label>
                  <Input
                    id="contact-name"
                    value={formData.contact_name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        contact_name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        contact_email: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={formData.support_email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      support_email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select
                    value={formData.plan_code}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        plan_code: value as typeof current.plan_code,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="pro_plus">Pro Plus</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tenant status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        status: value as typeof current.status,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_payment">Pending payment</SelectItem>
                      <SelectItem value="pending_approval">Pending approval</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <Select
                    value={formData.subscription_status}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        subscription_status: value as typeof current.subscription_status,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="grace">Grace</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((current) => ({
                      ...current,
                      is_active: Boolean(checked),
                    }))
                  }
                />
                <span>Tenant workspace is active</span>
              </label>

              <Button type="submit" disabled={updateTenant.isPending}>
                Save tenant changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Billing snapshot</CardTitle>
              <CardDescription>
                Current lifecycle and scheduled billing changes for this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-muted-foreground">Current plan</span>
                <span className="font-medium">{billing.current_plan.name}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground">Current period</p>
                  <p className="mt-2 font-medium">{formatDate(billing.current_period_end)}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground">Last payment</p>
                  <p className="mt-2 font-medium">{formatDate(billing.last_payment_at)}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-muted-foreground">Scheduled change</p>
                <p className="mt-2 font-medium">
                  {billing.scheduled_change
                    ? `${billing.scheduled_change.name} on ${formatDate(billing.scheduled_change.effective_at)}`
                    : "No scheduled plan change"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Tenant team</CardTitle>
              <CardDescription>
                First ten tenant-admin memberships attached to this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.map((member) => (
                <div key={member.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{member.role}</Badge>
                      <Badge variant={member.is_active ? "secondary" : "outline"}>
                        {member.is_active ? "active" : "inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.permissions.slice(0, 4).map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {team.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No tenant admins are attached to this workspace yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
