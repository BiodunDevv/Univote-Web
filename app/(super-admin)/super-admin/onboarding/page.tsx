"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FilePenLine,
  Mail,
  PhoneCall,
  Receipt,
  TicketPercent,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePlatformTenantsQuery, useUpdatePlatformTenantMutation } from "@/lib/queries/platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
                <OnboardingTenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingTenantCard({
  tenant,
}: {
  tenant: NonNullable<ReturnType<typeof usePlatformTenantsQuery>["data"]>["tenants"][number];
}) {
  const updateMutation = useUpdatePlatformTenantMutation(tenant.id);
  const latestInvoice = tenant.billing?.invoices?.[0] ?? null;
  const amountLabel =
    latestInvoice && Number.isFinite(latestInvoice.amount_ngn)
      ? `NGN ${latestInvoice.amount_ngn.toLocaleString()}`
      : null;
  const paymentStateLabel =
    tenant.status === "pending_approval"
      ? "Payment received"
      : tenant.onboarding?.payment_required === false
        ? "No payment required"
        : latestInvoice?.status
          ? latestInvoice.status.replace(/_/g, " ")
          : "Awaiting payment";

  return (
    <Card className="border-border/60">
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
            {paymentStateLabel}
          </Badge>
          <Badge variant="outline">
            {tenant.onboarding?.student_count_estimate || 0} participants
          </Badge>
          <Badge variant="outline">
            {tenant.onboarding?.admin_count_estimate || 0} admins
          </Badge>
          {tenant.application_reference ? (
            <Badge variant="outline">
              Ref {tenant.application_reference}
            </Badge>
          ) : null}
          {tenant.onboarding?.coupon_code ? (
            <Badge variant="outline">
              Coupon {tenant.onboarding.coupon_code}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm md:grid-cols-3">
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
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Billing
            </p>
            <p className="mt-1 font-medium">
              {amountLabel || "Awaiting invoice"}
            </p>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-3.5" />
              <span>{paymentStateLabel}</span>
            </div>
            {latestInvoice?.payment_reference ? (
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <Receipt className="size-3.5" />
                <span className="truncate">{latestInvoice.payment_reference}</span>
              </div>
            ) : null}
            {tenant.onboarding?.coupon_code ? (
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <TicketPercent className="size-3.5" />
                <span>{tenant.onboarding.coupon_code}</span>
              </div>
            ) : null}
          </div>
        </div>

        {tenant.onboarding?.notes ? (
          <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            {tenant.onboarding.notes}
          </div>
        ) : null}

        {tenant.onboarding?.rejection_reason ? (
          <div className="rounded-xl border border-amber-300/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Rejection note:</span>{" "}
            {tenant.onboarding.rejection_reason}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Demo requested: {tenant.onboarding?.demo_requested ? "Yes" : "No"}
          </div>
          <div className="flex flex-wrap gap-2">
            {tenant.status === "pending_approval" ? (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await updateMutation.mutateAsync({
                      status: "active",
                      subscription_status: "active",
                    });
                    toast.success("Tenant approved successfully");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to approve tenant");
                  }
                }}
                disabled={updateMutation.isPending}
              >
                Approve application
              </Button>
            ) : null}
            {tenant.status === "pending_approval" || tenant.status === "pending_payment" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await updateMutation.mutateAsync({
                      status: "draft",
                    });
                    toast.success("Application moved back to draft");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to update application");
                  }
                }}
                disabled={updateMutation.isPending}
              >
                Return to draft
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/super-admin/tenants/${tenant.id}`}>
                Review tenant
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <ApplicationReviewDialog tenant={tenant} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationReviewDialog({
  tenant,
}: {
  tenant: NonNullable<ReturnType<typeof usePlatformTenantsQuery>["data"]>["tenants"][number];
}) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdatePlatformTenantMutation(tenant.id);
  const latestInvoice = tenant.billing?.invoices?.[0] ?? null;
  const [form, setForm] = useState({
    contact_name: tenant.onboarding?.contact_name || "",
    contact_email: tenant.onboarding?.contact_email || "",
    institution_type: tenant.onboarding?.institution_type || "organization",
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
    rejection_reason: tenant.onboarding?.rejection_reason || "",
    status: tenant.status || "draft",
    subscription_status: tenant.subscription_status || "trial",
    plan_code: tenant.plan_code || "pro",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      contact_name: tenant.onboarding?.contact_name || "",
      contact_email: tenant.onboarding?.contact_email || "",
      institution_type: tenant.onboarding?.institution_type || "organization",
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
      rejection_reason: tenant.onboarding?.rejection_reason || "",
      status: tenant.status || "draft",
      subscription_status: tenant.subscription_status || "trial",
      plan_code: tenant.plan_code || "pro",
    });
  }, [open, tenant]);

  const saveChanges = async () => {
    await updateMutation.mutateAsync({
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      institution_type: form.institution_type,
      student_count_estimate: form.student_count_estimate
        ? Number(form.student_count_estimate)
        : null,
      admin_count_estimate: form.admin_count_estimate
        ? Number(form.admin_count_estimate)
        : null,
      notes: form.notes,
      demo_requested: form.demo_requested,
      payment_required: form.payment_required,
      rejection_reason: form.rejection_reason,
      status: form.status as "draft" | "pending_payment" | "pending_approval" | "active" | "suspended",
      subscription_status: form.subscription_status as "trial" | "active" | "grace" | "expired" | "suspended",
      plan_code: form.plan_code as "pro" | "pro_plus" | "enterprise",
    });
  };

  const statusTimeline = tenant.onboarding?.status_timeline || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FilePenLine className="mr-2 size-4" />
        Quick review
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review {tenant.name}</DialogTitle>
          <DialogDescription>
            Save moderation changes directly from the onboarding queue. These values persist and reload from the platform record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reference</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{tenant.application_reference || "Not assigned"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Invoice status</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{latestInvoice?.status || tenant.status}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payable amount</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  NGN {tenant.onboarding?.billing_snapshot?.payable_amount_ngn?.toLocaleString?.() ?? latestInvoice?.amount_ngn?.toLocaleString?.() ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact name</Label>
                  <Input value={form.contact_name} onChange={(event) => setForm((current) => ({ ...current, contact_name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input type="email" value={form.contact_email} onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Organization type</Label>
                  <Select value={form.institution_type} onValueChange={(value) => setForm((current) => ({ ...current, institution_type: value }))}>
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
                  <Label>Participant estimate</Label>
                  <Input type="number" min="0" value={form.student_count_estimate} onChange={(event) => setForm((current) => ({ ...current, student_count_estimate: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Admin estimate</Label>
                  <Input type="number" min="0" value={form.admin_count_estimate} onChange={(event) => setForm((current) => ({ ...current, admin_count_estimate: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan_code} onValueChange={(value) => setForm((current) => ({ ...current, plan_code: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="pro_plus">Pro Plus</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
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
                  <Select value={form.subscription_status} onValueChange={(value) => setForm((current) => ({ ...current, subscription_status: value }))}>
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">Demo requested</span>
                    <p className="text-xs text-muted-foreground">Track whether the applicant asked for a guided walkthrough.</p>
                  </div>
                  <Switch checked={form.demo_requested} onCheckedChange={(checked) => setForm((current) => ({ ...current, demo_requested: checked }))} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">Payment required</span>
                    <p className="text-xs text-muted-foreground">Disable only when the application should bypass billing.</p>
                  </div>
                  <Switch checked={form.payment_required} onCheckedChange={(checked) => setForm((current) => ({ ...current, payment_required: checked }))} />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Application notes</Label>
                <Textarea rows={5} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Review note / rejection reason</Label>
                <Input value={form.rejection_reason} onChange={(event) => setForm((current) => ({ ...current, rejection_reason: event.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium text-foreground">Payment context</p>
              <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>Latest invoice</dt>
                  <dd className="font-medium text-foreground">{latestInvoice?.invoice_number || "Not issued"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Reference</dt>
                  <dd className="max-w-[14rem] truncate font-medium text-foreground">{latestInvoice?.payment_reference || "Not available"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Coupon</dt>
                  <dd className="font-medium text-foreground">{tenant.onboarding?.coupon_code || "None"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Submitted</dt>
                  <dd className="font-medium text-foreground">{tenant.onboarding?.application_submitted_at ? new Date(tenant.onboarding.application_submitted_at).toLocaleDateString() : "Not set"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium text-foreground">Status timeline</p>
              <div className="mt-4 space-y-3">
                {statusTimeline.length > 0 ? statusTimeline.map((item) => (
                  <div key={`${item.status}-${item.at}`} className="rounded-xl border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
                    {item.note ? <p className="mt-1 text-sm text-muted-foreground">{item.note}</p> : null}
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    No status history recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={async () => {
              try {
                await updateMutation.mutateAsync({
                  status: "active",
                  subscription_status: "active",
                });
                toast.success("Tenant approved successfully");
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to approve tenant");
              }
            }}
          >
            Approve application
          </Button>
          <Button
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={async () => {
              try {
                await updateMutation.mutateAsync({
                  status: "draft",
                  rejection_reason: form.rejection_reason || "Returned for revision",
                });
                toast.success("Application moved back to draft");
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update application");
              }
            }}
          >
            Return to draft
          </Button>
          <Button
            disabled={updateMutation.isPending}
            onClick={async () => {
              try {
                await saveChanges();
                toast.success("Application review updated");
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to save review changes");
              }
            }}
          >
            Save review changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
