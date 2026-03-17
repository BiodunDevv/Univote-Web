"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock3,
  Globe,
  Mail,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReviewStatus = "active" | "suspended";

function toTitleCase(value?: string | null) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "PPP");
}

function getStatusMeta(status?: string) {
  if (status === "active") {
    return {
      label: "Active",
      icon: ShieldCheck,
      badgeCn: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
      heroCn: "border-emerald-500/20 from-emerald-500/8",
    };
  }

  if (status === "suspended") {
    return {
      label: "Suspended",
      icon: XCircle,
      badgeCn: "border-destructive/40 bg-destructive/10 text-destructive",
      heroCn: "border-destructive/20 from-destructive/8",
    };
  }

  return {
    label: "Under review",
    icon: Clock3,
    badgeCn: "border-amber-500/40 bg-amber-500/10 text-amber-700",
    heroCn: "border-amber-500/20 from-amber-500/8",
  };
}

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;
  const tenantQuery = usePlatformTenantQuery(tenantId);
  const updateTenant = useUpdatePlatformTenantMutation(tenantId);

  const [formData, setFormData] = useState({
    name: "",
    primary_domain: "",
    contact_name: "",
    contact_email: "",
    support_email: "",
    student_count_estimate: "",
    admin_count_estimate: "",
    notes: "",
    demo_requested: false,
    status: "suspended" as ReviewStatus,
    is_active: false,
    rejection_reason: "",
  });

  useEffect(() => {
    const tenant = tenantQuery.data?.tenant;
    if (!tenant) return;

    const status: ReviewStatus =
      tenant.status === "active" ? "active" : "suspended";

    setFormData({
      name: tenant.name || "",
      primary_domain: tenant.primary_domain || "",
      contact_name: tenant.onboarding?.contact_name || "",
      contact_email: tenant.onboarding?.contact_email || "",
      support_email: tenant.branding?.support_email || "",
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
      status,
      is_active: status === "active",
      rejection_reason: tenant.onboarding?.rejection_reason || "",
    });
  }, [tenantQuery.data?.tenant]);

  const isLoading = tenantQuery.isLoading;
  const errorMessage = tenantQuery.error?.message;
  const tenant = tenantQuery.data?.tenant;
  const stats = tenantQuery.data?.stats;
  const team = tenantQuery.data?.team || [];
  const statusTimeline = tenant?.onboarding?.status_timeline || [];

  async function saveReview(changes?: Partial<typeof formData>) {
    const payload = { ...(changes || formData) };

    try {
      await updateTenant.mutateAsync({
        name: payload.name,
        primary_domain: payload.primary_domain || "",
        contact_name: payload.contact_name || "",
        contact_email: payload.contact_email || "",
        support_email: payload.support_email || "",
        student_count_estimate: payload.student_count_estimate
          ? Number(payload.student_count_estimate)
          : null,
        admin_count_estimate: payload.admin_count_estimate
          ? Number(payload.admin_count_estimate)
          : null,
        notes: payload.notes || "",
        demo_requested: payload.demo_requested,
        rejection_reason: payload.rejection_reason || "",
        status: payload.status,
        is_active: payload.is_active,
      });

      toast.success("Tenant review updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update tenant",
      );
    }
  }

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading tenant application...",
          "Loading tenant status history...",
          "Preparing review controls...",
        ]}
      />
    );
  }

  if (!tenant || !stats) {
    return (
      <Card className="border-destructive/40 shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {errorMessage || "Tenant detail is unavailable right now."}
        </CardContent>
      </Card>
    );
  }

  const statusMeta = getStatusMeta(tenant.status);
  const StatusIcon = statusMeta.icon;
  const isActive = tenant.status === "active";

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
                variant="outline"
                className="rounded-full px-3 py-0.5 text-xs"
              >
                {tenant.slug}
              </Badge>
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

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">
              Application submitted
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(tenant.onboarding?.application_submitted_at)}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(tenant.onboarding?.approved_at)}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Activated</p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(tenant.onboarding?.activated_at)}
            </p>
          </div>
        </div>

        {isActive ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            <BadgeCheck className="size-4 shrink-0" />
            <span>
              <span className="font-semibold">
                Tenant is activated and usable
              </span>
              {tenant.onboarding?.activated_at
                ? ` since ${format(new Date(tenant.onboarding.activated_at), "PPP")}`
                : ""}
              .
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            <span>
              <span className="font-semibold">Tenant is suspended</span>. Admins
              and students are blocked from using the tenant workspace.
            </span>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Admins",
            value: stats.admins.total,
            sub: `${stats.admins.active} active`,
          },
          {
            label: "Students",
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

      <Tabs defaultValue="review" className="w-full space-y-6">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Application data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y text-sm">
                  {[
                    [
                      "Reference",
                      tenant.application_reference || "Not assigned",
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
                    ["Institution", "University"],
                    [
                      "Student estimate",
                      String(tenant.onboarding?.student_count_estimate ?? 0),
                    ],
                    [
                      "Admin estimate",
                      String(tenant.onboarding?.admin_count_estimate ?? 0),
                    ],
                    [
                      "Demo requested",
                      tenant.onboarding?.demo_requested ? "Yes" : "No",
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
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statusTimeline.length > 0 ? (
                    statusTimeline.map((item) => {
                      const tMeta = getStatusMeta(item.status);
                      const TIcon = tMeta.icon;
                      return (
                        <div
                          key={`${item.status}-${item.at}`}
                          className="flex gap-3 rounded-xl border bg-muted/20 p-3"
                        >
                          <TIcon
                            className={`mt-0.5 size-4 shrink-0 ${
                              tMeta.badgeCn
                                .split(" ")
                                .find((cn) => cn.startsWith("text-")) ||
                              "text-muted-foreground"
                            }`}
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
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No application history recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle>Review actions</CardTitle>
                <CardDescription>
                  Review tenant data, update moderation notes, then approve or
                  suspend access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
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

                  <div className="grid gap-3 sm:grid-cols-2">
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
                    <Label>Application status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          status: value as ReviewStatus,
                          is_active: value === "active",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-note">Review note</Label>
                    <Input
                      id="review-note"
                      value={formData.rejection_reason}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          rejection_reason: event.target.value,
                        }))
                      }
                      placeholder="Internal moderation note"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Application notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={5}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {tenant.status === "active" ? (
                    <Button type="button" className="w-full" disabled>
                      <CheckCircle2 className="mr-2 size-4" />
                      Already Approved
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      disabled={updateTenant.isPending}
                      onClick={() =>
                        void saveReview({
                          ...formData,
                          status: "active",
                          is_active: true,
                          rejection_reason: "",
                        })
                      }
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      Approve and Activate
                    </Button>
                  )}

                  {tenant.status === "suspended" ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      disabled
                    >
                      <XCircle className="mr-2 size-4" />
                      Already Suspended
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      disabled={updateTenant.isPending}
                      onClick={() =>
                        void saveReview({
                          ...formData,
                          status: "suspended",
                          is_active: false,
                        })
                      }
                    >
                      <XCircle className="mr-2 size-4" />
                      Suspend Tenant Access
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={updateTenant.isPending}
                    onClick={() => void saveReview()}
                  >
                    Save Review Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                Team memberships for this tenant workspace.
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
      </Tabs>
    </div>
  );
}
