"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FilePenLine,
  FileSearch,
  Mail,
  PhoneCall,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  usePlatformTenantsQuery,
  useUpdatePlatformTenantMutation,
} from "@/lib/queries/platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  draft: {
    label: "Draft Applications",
    description:
      "Submitted tenant records that still need application details or moderation actions.",
    icon: FileSearch,
  },
  pending_approval: {
    label: "Pending Approval",
    description:
      "University applications ready for provisioning review, approval, and activation.",
    icon: BadgeCheck,
  },
} as const;

export default function PlatformOnboardingPage() {
  const [status, setStatus] = useState<keyof typeof tabConfig>("draft");
  const draftQuery = usePlatformTenantsQuery({
    status: "draft",
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
    draft: draftQuery.data?.total || 0,
    pending_approval: pendingApprovalQuery.data?.total || 0,
  };

  const ActiveIcon = tabConfig[status].icon;

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border bg-linear-to-br from-card via-card to-muted/40 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Tenant Onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Track university applications from submission through platform
              approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="secondary">{summary.draft} drafts</Badge>
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
          <Tabs
            value={status}
            onValueChange={(value) =>
              setStatus(value as keyof typeof tabConfig)
            }
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="pending_approval">
                Pending approval
              </TabsTrigger>
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
            <div className="space-y-4">
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
  tenant: NonNullable<
    ReturnType<typeof usePlatformTenantsQuery>["data"]
  >["tenants"][number];
}) {
  const updateMutation = useUpdatePlatformTenantMutation(tenant.id);
  const [actionState, setActionState] = useState<"approve" | "draft" | null>(
    null,
  );
  const reviewStateLabel =
    tenant.status === "pending_approval"
      ? "Ready for decision"
      : "Draft in progress";

  return (
    <Card className="overflow-hidden border-border/60 shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle
              className="line-clamp-2 wrap-break-word text-xl"
              title={tenant.name}
            >
              {tenant.name}
            </CardTitle>
            <CardDescription className="truncate" title={tenant.slug}>
              {tenant.slug}
            </CardDescription>
          </div>
          <Badge
            variant={
              tenant.status === "pending_approval" ? "default" : "secondary"
            }
            className="shrink-0"
          >
            {tenant.status?.replace("_", " ")}
          </Badge>
        </div>
        <div
          className="flex flex-wrap gap-2 text-xs"
          title={tenant.application_reference || undefined}
        >
          <Badge variant="outline">University</Badge>
          <Badge variant="outline">{reviewStateLabel}</Badge>
          <Badge variant="outline">
            {tenant.onboarding?.student_count_estimate || 0} students
          </Badge>
          <Badge variant="outline">
            {tenant.onboarding?.admin_count_estimate || 0} admins
          </Badge>
          {tenant.application_reference ? (
            <Badge variant="outline">Ref {tenant.application_reference}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm lg:grid-cols-3">
          <div className="min-w-0 rounded-xl bg-muted/50 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Contact
            </p>
            <p
              className="mt-1 wrap-break-word font-medium"
              title={tenant.onboarding?.contact_name || undefined}
            >
              {tenant.onboarding?.contact_name || "Not provided"}
            </p>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3.5" />
              <span
                className="min-w-0 break-all"
                title={tenant.onboarding?.contact_email || undefined}
              >
                {tenant.onboarding?.contact_email || "No email"}
              </span>
            </div>
            {tenant.onboarding?.contact_phone ? (
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <PhoneCall className="size-3.5" />
                <span
                  className="break-all"
                  title={tenant.onboarding.contact_phone}
                >
                  {tenant.onboarding.contact_phone}
                </span>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 rounded-xl bg-muted/50 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Timing
            </p>
            <p className="mt-1 font-medium">
              Applied{" "}
              {tenant.onboarding?.application_submitted_at
                ? new Date(
                    tenant.onboarding.application_submitted_at,
                  ).toLocaleDateString()
                : "recently"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span
                className="break-all"
                title={tenant.primary_domain || undefined}
              >
                {tenant.primary_domain || "Subdomain-only deployment for now"}
              </span>
            </p>
          </div>
          <div className="min-w-0 rounded-xl bg-muted/50 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Application
            </p>
            <p className="mt-1 font-medium">
              {tenant.application_reference || "Reference pending"}
            </p>
            <div className="mt-2 text-muted-foreground">{reviewStateLabel}</div>
          </div>
        </div>

        {tenant.onboarding?.notes ? (
          <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            <p
              className="line-clamp-4 wrap-break-word"
              title={tenant.onboarding.notes}
            >
              {tenant.onboarding.notes}
            </p>
          </div>
        ) : null}

        {tenant.onboarding?.rejection_reason ? (
          <div className="rounded-xl border border-amber-300/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Review note:</span>{" "}
            <span
              className="wrap-break-word"
              title={tenant.onboarding.rejection_reason}
            >
              {tenant.onboarding.rejection_reason}
            </span>
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
                  setActionState("approve");
                  try {
                    await updateMutation.mutateAsync({
                      status: "active",
                    });
                    toast.success("Tenant approved successfully");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to approve tenant",
                    );
                  } finally {
                    setActionState(null);
                  }
                }}
                disabled={Boolean(actionState)}
              >
                {actionState === "approve"
                  ? "Approving..."
                  : "Approve application"}
              </Button>
            ) : null}
            {tenant.status === "pending_approval" ||
            tenant.status === "draft" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setActionState("draft");
                  try {
                    await updateMutation.mutateAsync({
                      status: "draft",
                    });
                    toast.success("Application moved back to draft");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update application",
                    );
                  } finally {
                    setActionState(null);
                  }
                }}
                disabled={Boolean(actionState)}
              >
                {actionState === "draft"
                  ? "Updating..."
                  : "Return to draft"}
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
  tenant: NonNullable<
    ReturnType<typeof usePlatformTenantsQuery>["data"]
  >["tenants"][number];
}) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdatePlatformTenantMutation(tenant.id);
  const [actionState, setActionState] = useState<
    "approve" | "draft" | "save" | null
  >(null);
  const [form, setForm] = useState({
    contact_name: tenant.onboarding?.contact_name || "",
    contact_email: tenant.onboarding?.contact_email || "",
    institution_type: "university",
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
    rejection_reason: tenant.onboarding?.rejection_reason || "",
    status: tenant.status || "draft",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      contact_name: tenant.onboarding?.contact_name || "",
      contact_email: tenant.onboarding?.contact_email || "",
      institution_type: "university",
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
      rejection_reason: tenant.onboarding?.rejection_reason || "",
      status: tenant.status || "draft",
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
      rejection_reason: form.rejection_reason,
      status: form.status as
        | "draft"
        | "pending_approval"
        | "active"
        | "suspended",
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
            Save moderation changes directly from the onboarding queue. These
            values persist and reload from the platform record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Reference
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {tenant.application_reference || "Not assigned"}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Application status
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {tenant.status}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Review note
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {tenant.onboarding?.rejection_reason || "No review note"}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact name</Label>
                  <Input
                    value={form.contact_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contact_name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contact_email: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Institution type</Label>
                  <Input value="University" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Student estimate</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.student_count_estimate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        student_count_estimate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admin estimate</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.admin_count_estimate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        admin_count_estimate: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Application status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_approval">
                        Pending approval
                      </SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">Demo requested</span>
                    <p className="text-xs text-muted-foreground">
                      Track whether the applicant asked for a guided
                      walkthrough.
                    </p>
                  </div>
                  <Switch
                    checked={form.demo_requested}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        demo_requested: checked,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Application notes</Label>
                <Textarea
                  rows={5}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Review note / rejection reason</Label>
                <Input
                  value={form.rejection_reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rejection_reason: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium text-foreground">
                Application context
              </p>
              <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>Reference</dt>
                  <dd className="font-medium text-foreground">
                    {tenant.application_reference || "Not assigned"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Institution</dt>
                  <dd className="font-medium text-foreground">University</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Submitted</dt>
                  <dd className="font-medium text-foreground">
                    {tenant.onboarding?.application_submitted_at
                      ? new Date(
                          tenant.onboarding.application_submitted_at,
                        ).toLocaleDateString()
                      : "Not set"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium text-foreground">
                Status timeline
              </p>
              <div className="mt-4 space-y-3">
                {statusTimeline.length > 0 ? (
                  statusTimeline.map((item) => (
                    <div
                      key={`${item.status}-${item.at}`}
                      className="rounded-xl border bg-muted/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{item.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
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
            disabled={Boolean(actionState)}
            onClick={async () => {
              setActionState("approve");
              try {
                await updateMutation.mutateAsync({
                  status: "active",
                });
                toast.success("Tenant approved successfully");
                setOpen(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to approve tenant",
                );
              } finally {
                setActionState(null);
              }
            }}
          >
            {actionState === "approve"
              ? "Approving..."
              : "Approve application"}
          </Button>
          <Button
            variant="outline"
            disabled={Boolean(actionState)}
            onClick={async () => {
              setActionState("draft");
              try {
                await updateMutation.mutateAsync({
                  status: "draft",
                  rejection_reason:
                    form.rejection_reason || "Returned for revision",
                });
                toast.success("Application moved back to draft");
                setOpen(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update application",
                );
              } finally {
                setActionState(null);
              }
            }}
          >
            {actionState === "draft" ? "Updating..." : "Return to draft"}
          </Button>
          <Button
            disabled={Boolean(actionState)}
            onClick={async () => {
              setActionState("save");
              try {
                await saveChanges();
                toast.success("Application review updated");
                setOpen(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to save review changes",
                );
              } finally {
                setActionState(null);
              }
            }}
          >
            {actionState === "save"
              ? "Saving..."
              : "Save review changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
