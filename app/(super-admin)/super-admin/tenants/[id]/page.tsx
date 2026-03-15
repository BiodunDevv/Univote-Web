"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    institution_type: "organization" as
      | "university"
      | "college"
      | "polytechnic"
      | "faculty"
      | "organization",
    student_count_estimate: "",
    admin_count_estimate: "",
    notes: "",
    demo_requested: false,
    payment_required: true,
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
    rejection_reason: "",
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
      institution_type: (tenant.onboarding?.institution_type || "organization") as
        | "university"
        | "college"
        | "polytechnic"
        | "faculty"
        | "organization",
      student_count_estimate:
        tenant.onboarding?.student_count_estimate !== undefined &&
        tenant.onboarding?.student_count_estimate !== null
          ? String(tenant.onboarding.student_count_estimate)
          : "",
      admin_count_estimate:
        tenant.onboarding?.admin_count_estimate !== undefined &&
        tenant.onboarding?.admin_count_estimate !== null
          ? String(tenant.onboarding.admin_count_estimate)
          : "",
      notes: tenant.onboarding?.notes || "",
      demo_requested: Boolean(tenant.onboarding?.demo_requested),
      payment_required: tenant.onboarding?.payment_required !== false,
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
      rejection_reason: tenant.onboarding?.rejection_reason || "",
    });
  }, [tenantQuery.data?.tenant]);

  const isLoading = tenantQuery.isLoading || billingQuery.isLoading;
  const errorMessage = tenantQuery.error?.message || billingQuery.error?.message;
  const tenant = tenantQuery.data?.tenant;
  const stats = tenantQuery.data?.stats;
  const team = tenantQuery.data?.team || [];
  const billing = billingQuery.data?.billing;
  const latestInvoice = useMemo(() => billing?.invoices?.[0] || null, [billing]);
  const statusTimeline = tenant?.onboarding?.status_timeline || [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await updateTenant.mutateAsync({
        ...formData,
        primary_domain: formData.primary_domain || "",
        contact_name: formData.contact_name || "",
        contact_email: formData.contact_email || "",
        support_email: formData.support_email || "",
        student_count_estimate: formData.student_count_estimate
          ? Number(formData.student_count_estimate)
          : null,
        admin_count_estimate: formData.admin_count_estimate
          ? Number(formData.admin_count_estimate)
          : null,
        notes: formData.notes || "",
        rejection_reason: formData.rejection_reason || "",
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

      <Tabs defaultValue="application" className="space-y-6">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="application" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Application review</CardTitle>
              <CardDescription>
                Review the submitted organization details, billing posture, and moderation notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reference</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {tenant.application_reference || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment state</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {latestInvoice?.status || tenant.status}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payable amount</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    NGN {tenant.onboarding?.billing_snapshot?.payable_amount_ngn?.toLocaleString?.() ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Submitted</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(tenant.onboarding?.application_submitted_at)}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Approved</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(tenant.onboarding?.approved_at)}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Activated</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(tenant.onboarding?.activated_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-medium text-foreground">Organization profile</p>
                  <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>Type</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.institution_type || "organization"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Contact</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.contact_name || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Applicant email</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.contact_email || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Coupon</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.coupon_code || "None"}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-medium text-foreground">Operational snapshot</p>
                  <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>Participants</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.student_count_estimate ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Admins</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.admin_count_estimate ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Demo requested</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.demo_requested ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Payment required</dt>
                      <dd className="font-medium text-foreground">{tenant.onboarding?.payment_required === false ? "No" : "Yes"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {tenant.onboarding?.notes ? (
                <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
                  {tenant.onboarding.notes}
                </div>
              ) : null}

              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium text-foreground">Status timeline</p>
                <div className="mt-4 space-y-3">
                  {statusTimeline.length > 0 ? statusTimeline.map((item: {
                    status: string;
                    label: string;
                    note?: string | null;
                    at: string;
                  }) => (
                    <div key={`${item.status}-${item.at}`} className="rounded-xl border bg-muted/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{item.status}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(item.at)}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
                      {item.note ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                      ) : null}
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No application history recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Review actions</CardTitle>
                <CardDescription>
                  Update and save moderation changes. The latest values persist and reload with the tenant.
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
                      <Input id="contact-name" value={formData.contact_name} onChange={(event) => setFormData((current) => ({ ...current, contact_name: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact email</Label>
                      <Input id="contact-email" type="email" value={formData.contact_email} onChange={(event) => setFormData((current) => ({ ...current, contact_email: event.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support email</Label>
                    <Input id="support-email" type="email" value={formData.support_email} onChange={(event) => setFormData((current) => ({ ...current, support_email: event.target.value }))} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Organization type</Label>
                      <Select value={formData.institution_type} onValueChange={(value) => setFormData((current) => ({ ...current, institution_type: value as typeof current.institution_type }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="organization">Organization</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="polytechnic">Polytechnic</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-count">Participant estimate</Label>
                      <Input id="student-count" type="number" min="0" value={formData.student_count_estimate} onChange={(event) => setFormData((current) => ({ ...current, student_count_estimate: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-count">Admin estimate</Label>
                      <Input id="admin-count" type="number" min="0" value={formData.admin_count_estimate} onChange={(event) => setFormData((current) => ({ ...current, admin_count_estimate: event.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                      <div className="space-y-1">
                        <span className="font-medium">Demo requested</span>
                        <p className="text-xs text-muted-foreground">Track whether this applicant asked for a guided walkthrough.</p>
                      </div>
                      <Switch checked={formData.demo_requested} onCheckedChange={(checked) => setFormData((current) => ({ ...current, demo_requested: checked }))} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                      <div className="space-y-1">
                        <span className="font-medium">Payment required</span>
                        <p className="text-xs text-muted-foreground">Turn this off only when the application should bypass billing entirely.</p>
                      </div>
                      <Switch checked={formData.payment_required} onCheckedChange={(checked) => setFormData((current) => ({ ...current, payment_required: checked }))} />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="application-notes">Application notes</Label>
                    <Textarea id="application-notes" value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} placeholder="Capture onboarding context, setup expectations, or review comments." rows={5} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Review note / rejection reason</Label>
                    <Input id="rejection-reason" value={formData.rejection_reason} onChange={(event) => setFormData((current) => ({ ...current, rejection_reason: event.target.value }))} placeholder="Visible for onboarding follow-up and application review history." />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select value={formData.plan_code} onValueChange={(value) => setFormData((current) => ({ ...current, plan_code: value as typeof current.plan_code }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="pro_plus">Pro Plus</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tenant status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData((current) => ({ ...current, status: value as typeof current.status }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Select value={formData.subscription_status} onValueChange={(value) => setFormData((current) => ({ ...current, subscription_status: value as typeof current.subscription_status }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Checkbox checked={formData.is_active} onCheckedChange={(checked) => setFormData((current) => ({ ...current, is_active: Boolean(checked) }))} />
                    <span>Tenant workspace is active</span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={updateTenant.isPending}>Save review changes</Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={updateTenant.isPending}
                      onClick={async () => {
                        try {
                          await updateTenant.mutateAsync({ status: "active", subscription_status: "active" });
                          toast.success("Application approved successfully");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to approve application");
                        }
                      }}
                    >
                      Approve application
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateTenant.isPending}
                      onClick={async () => {
                        try {
                          await updateTenant.mutateAsync({
                            status: "draft",
                            rejection_reason: formData.rejection_reason || "Returned for revision",
                          });
                          toast.success("Application moved back to draft");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to update application");
                        }
                      }}
                    >
                      Return to draft
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

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
          </div>
        </TabsContent>

        <TabsContent value="workspace" className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Tenant configuration</CardTitle>
              <CardDescription>
                Update the tenant’s domain, billing posture, and activation lifecycle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Workspace identity</p>
                        <p className="text-xs text-muted-foreground">
                          Keep the domain, owner contact, and support channel aligned with the current workspace.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenant-name">Tenant name</Label>
                        <Input id="tenant-name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenant-domain">Primary domain</Label>
                        <Input id="tenant-domain" value={formData.primary_domain} onChange={(event) => setFormData((current) => ({ ...current, primary_domain: event.target.value }))} placeholder="subdomain.univote.app" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Contact name</Label>
                        <Input id="contact-name" value={formData.contact_name} onChange={(event) => setFormData((current) => ({ ...current, contact_name: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Contact email</Label>
                        <Input id="contact-email" type="email" value={formData.contact_email} onChange={(event) => setFormData((current) => ({ ...current, contact_email: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-email">Support email</Label>
                        <Input id="support-email" type="email" value={formData.support_email} onChange={(event) => setFormData((current) => ({ ...current, support_email: event.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Applicant profile</p>
                        <p className="text-xs text-muted-foreground">
                          These fields stay prefilled from the saved application and can be corrected before approval.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-1">
                          <Label>Organization type</Label>
                          <Select value={formData.institution_type} onValueChange={(value) => setFormData((current) => ({ ...current, institution_type: value as typeof current.institution_type }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="organization">Organization</SelectItem>
                              <SelectItem value="university">University</SelectItem>
                              <SelectItem value="college">College</SelectItem>
                              <SelectItem value="polytechnic">Polytechnic</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-count">Participant estimate</Label>
                          <Input id="student-count" type="number" min="0" value={formData.student_count_estimate} onChange={(event) => setFormData((current) => ({ ...current, student_count_estimate: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-count">Admin estimate</Label>
                          <Input id="admin-count" type="number" min="0" value={formData.admin_count_estimate} onChange={(event) => setFormData((current) => ({ ...current, admin_count_estimate: event.target.value }))} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Review context</p>
                        <p className="text-xs text-muted-foreground">
                          Capture onboarding guidance, exceptions, and follow-up notes for later review.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="application-notes">Application notes</Label>
                        <Textarea id="application-notes" value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} placeholder="Capture onboarding context, setup expectations, or review comments." rows={6} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Review note / rejection reason</Label>
                        <Input id="rejection-reason" value={formData.rejection_reason} onChange={(event) => setFormData((current) => ({ ...current, rejection_reason: event.target.value }))} placeholder="Visible for onboarding follow-up and application review history." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Lifecycle controls</p>
                        <p className="text-xs text-muted-foreground">
                          Manage the commercial state, activation status, and subscription posture for this workspace.
                        </p>
                      </div>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select value={formData.plan_code} onValueChange={(value) => setFormData((current) => ({ ...current, plan_code: value as typeof current.plan_code }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="pro_plus">Pro Plus</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tenant status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData((current) => ({ ...current, status: value as typeof current.status }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Select value={formData.subscription_status} onValueChange={(value) => setFormData((current) => ({ ...current, subscription_status: value as typeof current.subscription_status }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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

                      <div className="grid gap-4">
                        <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                          <div className="space-y-1">
                            <span className="font-medium">Demo requested</span>
                            <p className="text-xs text-muted-foreground">Track whether this applicant asked for a guided walkthrough.</p>
                          </div>
                          <Switch checked={formData.demo_requested} onCheckedChange={(checked) => setFormData((current) => ({ ...current, demo_requested: checked }))} />
                        </label>
                        <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                          <div className="space-y-1">
                            <span className="font-medium">Payment required</span>
                            <p className="text-xs text-muted-foreground">Turn this off only when the application should bypass billing entirely.</p>
                          </div>
                          <Switch checked={formData.payment_required} onCheckedChange={(checked) => setFormData((current) => ({ ...current, payment_required: checked }))} />
                        </label>
                        <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                          <Checkbox checked={formData.is_active} onCheckedChange={(checked) => setFormData((current) => ({ ...current, is_active: Boolean(checked) }))} />
                          <span>Tenant workspace is active</span>
                        </label>
                      </div>
                    </div>

                    <Card className="border shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base">Current saved snapshot</CardTitle>
                        <CardDescription>
                          A quick reference of the prefilled workspace values you are editing now.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="rounded-xl border p-4">
                          <p className="text-muted-foreground">Tenant name</p>
                          <p className="mt-2 font-medium">{formData.name || "Not set"}</p>
                        </div>
                        <div className="rounded-xl border p-4">
                          <p className="text-muted-foreground">Primary domain</p>
                          <p className="mt-2 font-medium">{formData.primary_domain || "Not set"}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border p-4">
                            <p className="text-muted-foreground">Contact</p>
                            <p className="mt-2 font-medium">{formData.contact_name || "Not set"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formData.contact_email || "No email"}</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="text-muted-foreground">Support</p>
                            <p className="mt-2 font-medium">{formData.support_email || "Not set"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

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
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={updateTenant.isPending}>
                    Save tenant changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
