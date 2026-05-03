"use client";

export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { Building2, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "PPP");
}

function toTitleCase(value?: string | null) {
  if (!value) return "Not set";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusTone(status?: string | null) {
  switch (status) {
    case "active":
      return {
        icon: CheckCircle2,
        badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
        title: "Workspace approved",
        note: "Your university workspace is approved and fully active.",
      };
    case "pending_approval":
      return {
        icon: Clock3,
        badge: "border-amber-500/40 bg-amber-500/10 text-amber-700",
        title: "Under platform review",
        note: "Your latest university application is in the review queue.",
      };
    case "suspended":
      return {
        icon: XCircle,
        badge: "border-destructive/40 bg-destructive/10 text-destructive",
        title: "Workspace restricted",
        note: "Access is currently restricted. Contact platform support for reactivation.",
      };
    default:
      return {
        icon: Clock3,
        badge: "border-border bg-muted/40 text-muted-foreground",
        title: "Application in progress",
        note: "Complete your application details and wait for platform moderation.",
      };
  }
}

export default function ApplicationPage() {
  const { tenant } = useAuthStore();
  const onboarding = tenant?.onboarding;
  const tone = getStatusTone(tenant?.status);
  const ToneIcon = tone.icon;

  return (
    <div className="space-y-6">
      <TenantPageHeader
        eyebrow="Tenant onboarding"
        icon={<Building2 className="h-5 w-5" />}
        title="Application & Access"
        subtitle="Track university application progress, review moderation notes, and confirm workspace activation milestones."
        stats={[
          {
            label: "Status",
            value: toTitleCase(tenant?.status) || "Draft",
          },
          {
            label: "Institution",
            value: "University",
          },
          {
            label: "Submitted",
            value: formatDate(onboarding?.application_submitted_at),
          },
          {
            label: "Activated",
            value: formatDate(onboarding?.activated_at),
          },
        ]}
      />

      <Card className="shadow-none">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ToneIcon className="mt-0.5 size-4" />
          <div>
            <p className="font-medium text-foreground">{tone.title}</p>
            <p className="text-muted-foreground">{tone.note}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Contact name</CardDescription>
            <CardTitle className="text-base">
              {onboarding?.contact_name || "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Contact email</CardDescription>
            <CardTitle className="text-base">
              {onboarding?.contact_email || "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Students Limit</CardDescription>
            <CardTitle className="text-base">
              {String(onboarding?.student_count_estimate ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Admins Limit</CardDescription>
            <CardTitle className="text-base">
              {String(onboarding?.admin_count_estimate ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <TenantSectionCard
        title="Moderation timeline"
        description="Recent milestones and review notes from platform moderation."
      >
        <div className="space-y-3">
          {(onboarding?.status_timeline || []).length > 0 ? (
            onboarding?.status_timeline?.map(
              (item: {
                status: string;
                label: string;
                note?: string | null;
                at: string;
              }) => (
                <div
                  key={`${item.status}-${item.at}`}
                  className="rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      className={`rounded-full border text-xs ${tone.badge}`}
                    >
                      {toTitleCase(item.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.label}</p>
                  {item.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  ) : null}
                </div>
              ),
            )
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No review events recorded yet.
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="rounded-xl border p-4 text-sm">
          <p className="font-medium text-foreground">Review note</p>
          <p className="mt-1 text-muted-foreground">
            {onboarding?.rejection_reason ||
              "No review note has been added yet."}
          </p>
        </div>
      </TenantSectionCard>
    </div>
  );
}
