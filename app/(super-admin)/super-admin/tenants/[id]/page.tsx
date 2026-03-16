"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe,
  Mail,
  Receipt,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  usePlatformTenantBillingQuery,
  usePlatformTenantQuery,
  useUpdatePlatformTenantMutation,
} from "@/lib/queries/platform";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

function toTitleCase(value?: string | null) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusMeta(status?: string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        icon: ShieldCheck,
        badgeCn: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
        heroCn: "border-emerald-500/20 from-emerald-500/8",
      };
    case "pending_approval":
      return {
        label: "Pending approval",
        icon: Clock3,
        badgeCn: "border-amber-500/40 bg-amber-500/10 text-amber-700",
        heroCn: "border-amber-500/20 from-amber-500/8",
      };
    case "pending_payment":
      return {
        label: "Pending payment",
        icon: CreditCard,
        badgeCn: "border-blue-500/40 bg-blue-500/10 text-blue-700",
        heroCn: "border-blue-500/20 from-blue-500/8",
      };
    case "suspended":
      return {
        label: "Suspended",
        icon: XCircle,
        badgeCn: "border-destructive/40 bg-destructive/10 text-destructive",
        heroCn: "border-destructive/20 from-destructive/8",
      };
    default:
      return {
        label: toTitleCase(status) || "Draft",
        icon: Clock3,
        badgeCn: "border-border bg-muted/40 text-muted-foreground",
        heroCn: "border-border from-muted/20",
      };
  }
}

function getSubStatusMeta(status?: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700";
    case "trial":
      return "border-blue-500/40 bg-blue-500/10 text-blue-700";
    case "grace":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700";
    case "expired":
    case "suspended":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function getInvoiceMeta(status?: string) {
  switch (status) {
    case "paid":
      return { icon: CheckCircle2, cn: "text-emerald-600", label: "Paid" };
    case "pending":
      return { icon: Clock3, cn: "text-amber-600", label: "Pending" };
    case "failed":
      return { icon: XCircle, cn: "text-destructive", label: "Failed" };
    default:
      return {
        icon: Receipt,
        cn: "text-muted-foreground",
        label: toTitleCase(status),
      };
  }
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
      institution_type: (tenant.onboarding?.institution_type ||
        "organization") as
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
      plan_code: (tenant.plan_code || "pro") as
        | "pro"
        | "pro_plus"
        | "enterprise",
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
  const errorMessage =
    tenantQuery.error?.message || billingQuery.error?.message;
  const tenant = tenantQuery.data?.tenant;
  const stats = tenantQuery.data?.stats;
  const team = tenantQuery.data?.team || [];
  const billing = billingQuery.data?.billing;
  const latestInvoice = useMemo(
    () => billing?.invoices?.[0] || null,
    [billing],
  );
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
      toast.error(
        error instanceof Error ? error.message : "Failed to update tenant",
      );
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

  const statusMeta = getStatusMeta(tenant.status);
  const subMeta = getSubStatusMeta(tenant.subscription_status);
  const StatusIcon = statusMeta.icon;
  const isApproved = tenant.status === "active";

  return (
    <div className="space-y-6">
      <section
        className={`rounded-4xl border bg-linear-to-br ${statusMeta.heroCn} to-transparent p-6 shadow-none`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusMeta.badgeCn}`}
              >
                <StatusIcon className="mr-1.5 inline size-3" />
                {statusMeta.label}
              </Badge>
              <Badge
                className={`rounded-full border px-3 py-0.5 text-xs font-medium ${subMeta}`}
              >
                {toTitleCase(tenant.subscription_status)}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full px-3 py-0.5 text-xs"
              >
                {tenant.slug}
              </Badge>
              {tenant.plan_code ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-0.5 text-xs"
                >
                  {toTitleCase(tenant.plan_code)}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {tenant.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {tenant.primary_domain ? (
                  <span className="flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    {tenant.primary_domain}
                  </span>
                ) : null}
                {tenant.onboarding?.contact_email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {tenant.onboarding.contact_email}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Created {format(new Date(tenant.createdAt), "PPP")}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/super-admin/tenants">
              <ArrowLeft className="mr-2 size-4" />
              Back to tenants
            </Link>
          </Button>
        </div>
        {isApproved ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            <BadgeCheck className="size-4 shrink-0" />
            <span>
              <span className="font-semibold">Workspace approved and live</span>
              {tenant.onboarding?.approved_at
                ? ` — activated on ${format(new Date(tenant.onboarding.approved_at), "PPP")}`
                : ""}
            </span>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Admins",
            value: stats.admins.total,
            sub: `${stats.admins.active} active`,
          },
          {
            label: "Participants",
            value: stats.students.total,
            sub: `${stats.students.active} active`,
          },
          { label: "Colleges", value: stats.colleges, sub: null },
          {
            label: "Sessions",
            value: stats.sessions.total,
            sub: `${stats.sessions.active} active`,
          },
          { label: "Candidates", value: stats.candidates, sub: null },
          {
            label: "Votes",
            value: stats.votes.total,
            sub: `${stats.votes.accepted} accepted`,
          },
        ].map((item) => (
          <Card key={item.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1.5 text-3xl font-semibold">{item.value}</p>
              {item.sub ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.sub}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="application" className="w-full space-y-6">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="application" className="w-full space-y-6">
          {isApproved ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                <span className="font-semibold">Application approved — </span>
                workspace is live and operational.
              </span>
            </div>
          ) : tenant.status === "pending_approval" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-sm text-amber-700">
              <Clock3 className="size-4 shrink-0" />
              <span>
                <span className="font-semibold">Awaiting your approval — </span>
                review the application details and use the actions panel to
                approve or return.
              </span>
            </div>
          ) : null}
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Reference
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {tenant.application_reference || "Not assigned"}
                  </p>
                </div>
                {(() => {
                  const inv = getInvoiceMeta(latestInvoice?.status);
                  const InvIcon = inv.icon;
                  return (
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Payment state
                      </p>
                      <p
                        className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${inv.cn}`}
                      >
                        <InvIcon className="size-3.5" />
                        {inv.label}
                      </p>
                    </div>
                  );
                })()}
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Payable amount
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    NGN{" "}
                    {tenant.onboarding?.billing_snapshot?.payable_amount_ngn?.toLocaleString?.() ??
                      0}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Submitted
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(tenant.onboarding?.application_submitted_at)}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Approved
                  </p>
                  <p
                    className={`mt-2 text-sm font-semibold ${isApproved ? "text-emerald-700" : ""}`}
                  >
                    {formatDate(tenant.onboarding?.approved_at)}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Activated
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(tenant.onboarding?.activated_at)}
                  </p>
                </div>
              </div>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Organization profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y text-sm">
                  {[
                    [
                      "Type",
                      toTitleCase(tenant.onboarding?.institution_type) ||
                        "Organization",
                    ],
                    [
                      "Contact name",
                      tenant.onboarding?.contact_name || "Not set",
                    ],
                    [
                      "Contact email",
                      tenant.onboarding?.contact_email || "Not set",
                    ],
                    [
                      "Support email",
                      tenant.branding?.support_email || "Not set",
                    ],
                    ["Coupon code", tenant.onboarding?.coupon_code || "None"],
                    [
                      "Demo requested",
                      tenant.onboarding?.demo_requested ? "Yes" : "No",
                    ],
                    [
                      "Payment required",
                      tenant.onboarding?.payment_required === false
                        ? "No"
                        : "Yes",
                    ],
                    [
                      "Participant estimate",
                      String(tenant.onboarding?.student_count_estimate ?? 0),
                    ],
                    [
                      "Admin estimate",
                      String(tenant.onboarding?.admin_count_estimate ?? 0),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                  {tenant.onboarding?.notes ? (
                    <>
                      <Separator />
                      <div className="pt-3 text-muted-foreground">
                        {tenant.onboarding.notes}
                      </div>
                    </>
                  ) : null}
                  {tenant.onboarding?.rejection_reason ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive text-xs mt-3">
                      <span className="font-semibold">Rejection reason: </span>
                      {tenant.onboarding.rejection_reason}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statusTimeline.length > 0 ? (
                    statusTimeline.map(
                      (item: {
                        status: string;
                        label: string;
                        note?: string | null;
                        at: string;
                      }) => {
                        const tMeta = getStatusMeta(item.status);
                        const TIcon = tMeta.icon;
                        return (
                          <div
                            key={`${item.status}-${item.at}`}
                            className="flex gap-3 rounded-xl border bg-muted/20 p-3"
                          >
                            <TIcon
                              className={`mt-0.5 size-4 shrink-0 ${tMeta.badgeCn.split(" ").find((c) => c.startsWith("text-")) ?? "text-muted-foreground"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge
                                  className={`rounded-full border text-xs ${tMeta.badgeCn}`}
                                >
                                  {toTitleCase(item.status)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(item.at)}
                                </span>
                              </div>
                              <p className="mt-1.5 text-sm font-medium">
                                {item.label}
                              </p>
                              {item.note ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {item.note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No application history recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle>Review actions</CardTitle>
                  <CardDescription>
                    Update and save moderation changes. The latest values
                    persist and reload with the tenant.
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
                    <div className="grid gap-4 sm:grid-cols-3">
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
                            <SelectItem value="enterprise">
                              Enterprise
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
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
                            <SelectItem value="pending_payment">
                              Pending payment
                            </SelectItem>
                            <SelectItem value="pending_approval">
                              Pending approval
                            </SelectItem>
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
                              subscription_status:
                                value as typeof current.subscription_status,
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

                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason-app">
                        Review note / rejection reason
                      </Label>
                      <Input
                        id="rejection-reason-app"
                        value={formData.rejection_reason}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            rejection_reason: event.target.value,
                          }))
                        }
                        placeholder="Visible in the application history timeline."
                      />
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                      <div>
                        <span className="font-medium">Payment required</span>
                        <p className="text-xs text-muted-foreground">
                          Turn off to bypass billing.
                        </p>
                      </div>
                      <Switch
                        checked={formData.payment_required}
                        onCheckedChange={(checked) =>
                          setFormData((current) => ({
                            ...current,
                            payment_required: checked,
                          }))
                        }
                      />
                    </label>

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
                      <span className="font-medium">
                        Tenant workspace is active
                      </span>
                    </label>

                    <Separator />

                    <div className="space-y-2">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={updateTenant.isPending}
                        onClick={async () => {
                          try {
                            await updateTenant.mutateAsync({
                              status: "active",
                              subscription_status: "active",
                            });
                            toast.success("Application approved");
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to approve",
                            );
                          }
                        }}
                      >
                        <ShieldCheck className="mr-2 size-4" />
                        Approve application
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                        disabled={updateTenant.isPending}
                      >
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={updateTenant.isPending}
                        onClick={async () => {
                          try {
                            await updateTenant.mutateAsync({
                              status: "draft",
                              rejection_reason:
                                formData.rejection_reason ||
                                "Returned for revision",
                            });
                            toast.success("Application returned to draft");
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to update",
                            );
                          }
                        }}
                      >
                        Return to draft
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {latestInvoice ? (
                <Card className="shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Latest invoice</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Invoice #</span>
                      <span className="font-mono text-xs font-medium">
                        {latestInvoice.payment_reference ||
                          latestInvoice.invoice_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        NGN {latestInvoice.amount_ngn?.toLocaleString?.()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      {(() => {
                        const im = getInvoiceMeta(latestInvoice.status);
                        const IIcon = im.icon;
                        return (
                          <span
                            className={`flex items-center gap-1.5 font-medium ${im.cn}`}
                          >
                            <IIcon className="size-3.5" />
                            {im.label}
                          </span>
                        );
                      })()}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Issued {formatDate(latestInvoice.issued_at)}</span>
                      {latestInvoice.paid_at ? (
                        <span>Paid {formatDate(latestInvoice.paid_at)}</span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Workspace</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {formData.name || "Not set"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.primary_domain || "No primary domain"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {formData.contact_name || "Not set"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.contact_email || "No contact email"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Profile type</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {toTitleCase(formData.institution_type)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Participants: {formData.student_count_estimate || "0"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Lifecycle</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {toTitleCase(formData.status)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Plan: {toTitleCase(formData.plan_code)}
                </p>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Workspace identity</CardTitle>
                <CardDescription>
                  Core identity fields for this tenant workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
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
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Applicant profile</CardTitle>
                <CardDescription>
                  Prefilled onboarding profile details for review and
                  correction.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Organization type</Label>
                  <Select
                    value={formData.institution_type}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        institution_type:
                          value as typeof current.institution_type,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Input
                    id="student-count"
                    type="number"
                    min="0"
                    value={formData.student_count_estimate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        student_count_estimate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-count">Admin estimate</Label>
                  <Input
                    id="admin-count"
                    type="number"
                    min="0"
                    value={formData.admin_count_estimate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        admin_count_estimate: event.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Lifecycle and controls</CardTitle>
                <CardDescription>
                  Commercial state and operational toggles for this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <SelectItem value="pending_payment">
                          Pending payment
                        </SelectItem>
                        <SelectItem value="pending_approval">
                          Pending approval
                        </SelectItem>
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
                          subscription_status:
                            value as typeof current.subscription_status,
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

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                    <div>
                      <span className="font-medium">Demo requested</span>
                    </div>
                    <Switch
                      checked={formData.demo_requested}
                      onCheckedChange={(checked) =>
                        setFormData((current) => ({
                          ...current,
                          demo_requested: checked,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                    <div>
                      <span className="font-medium">Payment required</span>
                    </div>
                    <Switch
                      checked={formData.payment_required}
                      onCheckedChange={(checked) =>
                        setFormData((current) => ({
                          ...current,
                          payment_required: checked,
                        }))
                      }
                    />
                  </label>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Review notes</CardTitle>
                <CardDescription>
                  Internal moderation context and applicant-facing review notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="application-notes">Application notes</Label>
                  <Textarea
                    id="application-notes"
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Capture onboarding context, setup expectations, or review comments."
                    rows={7}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">
                    Review note / rejection reason
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={formData.rejection_reason}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        rejection_reason: event.target.value,
                      }))
                    }
                    placeholder="Visible for onboarding follow-up and application review history."
                    rows={7}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateTenant.isPending}>
                Save tenant changes
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Total members</p>
                <p className="mt-1.5 text-2xl font-semibold">{team.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="mt-1.5 text-2xl font-semibold">
                  {team.filter((member) => member.is_active).length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Inactive</p>
                <p className="mt-1.5 text-2xl font-semibold">
                  {team.filter((member) => !member.is_active).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Tenant team</CardTitle>
              <CardDescription>
                Team memberships shown as one clean card per member.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No tenant admins are attached to this workspace yet.
                </div>
              ) : (
                team.map((member) => (
                  <div key={member.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{member.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                        <Badge
                          variant={member.is_active ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {member.is_active ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-wrap gap-2">
                      {member.permissions.length > 0 ? (
                        member.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary">
                            {permission}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No permissions assigned.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Current plan</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {billing.current_plan.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {toTitleCase(billing.billing_cycle)} billing
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Current period</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {formatDate(billing.current_period_end)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Grace ends {formatDate(billing.grace_ends_at)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Last payment</p>
                <p className="mt-1.5 text-lg font-semibold">
                  {formatDate(billing.last_payment_at)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Currency: {billing.currency}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">
                  Scheduled change
                </p>
                <p className="mt-1.5 text-lg font-semibold">
                  {billing.scheduled_change?.name || "None"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {billing.scheduled_change
                    ? `Effective ${formatDate(billing.scheduled_change.effective_at)}`
                    : "No pending plan migration"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Invoice history</CardTitle>
              <CardDescription>
                One row card per invoice with professional status indicators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {billing.invoices.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No invoices available yet.
                </div>
              ) : (
                billing.invoices.map((invoice) => {
                  const meta = getInvoiceMeta(invoice.status);
                  const StatusInvoiceIcon = meta.icon;

                  return (
                    <div key={invoice.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ref: {invoice.payment_reference || "Not set"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-full ${meta.cn}`}
                        >
                          <StatusInvoiceIcon className="mr-1.5 size-3.5" />
                          {meta.label}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            NGN {invoice.amount_ngn.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">Plan</p>
                          <p className="mt-1 text-sm font-medium">
                            {toTitleCase(invoice.plan_code)}
                          </p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Issued
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {formatDate(invoice.issued_at)}
                          </p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="mt-1 text-sm font-medium">
                            {formatDate(invoice.paid_at)}
                          </p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Checkout
                          </p>
                          {invoice.provider_checkout_url ? (
                            <a
                              href={invoice.provider_checkout_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Open link
                            </a>
                          ) : (
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                              Not available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
