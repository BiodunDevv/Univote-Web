"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Info,
  Mail,
  ShieldCheck,
  Vote,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalPage,
  PortalSectionHeader,
  PortalStackCard,
} from "@/components/students/portal/portal-page";
import { StudentSessionCard } from "@/components/students/portal/session-card";
import { useStudentDashboardQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";

export default function StudentHomePage() {
  const { data, isLoading, error } = useStudentDashboardQuery();
  const participantLabels = getTenantParticipantLabels(data?.tenant);

  if (isLoading && !data) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your portal...",
          "Checking available elections...",
          "Refreshing your dashboard...",
        ]}
      />
    );
  }

  if (error || !data) {
    return (
      <PortalEmptyState
        icon={Building2}
        title="Workspace unavailable"
        description={
          (error as Error | undefined)?.message ||
          "Your portal workspace is unavailable right now."
        }
      />
    );
  }

  const participantIdentifier = formatParticipantIdentifier(
    data.student_info,
    data.tenant,
  );
  const participantMeta = [
    shouldShowTenantParticipantFieldInProfile(data.tenant, "department") &&
    data.student_info.department
      ? data.student_info.department
      : null,
    shouldShowTenantParticipantFieldInProfile(data.tenant, "level") &&
    data.student_info.level
      ? `Level ${data.student_info.level}`
      : null,
  ].filter(Boolean);

  const subline = [participantIdentifier, ...participantMeta]
    .filter(Boolean)
    .join(" · ");

  return (
    <PortalPage>
      {/* Compact greeting — app-style, not hero */}
      <div className="animate-slide-up flex items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {participantLabels.singular} portal
            {data.tenant ? (
              <span className="ml-1.5 normal-case tracking-normal">
                · {data.tenant.name}
              </span>
            ) : null}
          </p>
          <h1 className="mt-0.5 truncate text-lg font-semibold text-foreground">
            {data.student_info.full_name}
          </h1>
          {subline ? (
            <p className="truncate text-xs text-muted-foreground">{subline}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className={
              data.voting_stats.active_sessions > 0
                ? "flex items-center gap-1.5 rounded-full border border-emerald-300/60 px-2.5 py-1 dark:border-emerald-700/40"
                : "flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            }
          >
            <span
              className={
                data.voting_stats.active_sessions > 0
                  ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
              }
            />
            <span
              className={
                data.voting_stats.active_sessions > 0
                  ? "text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                  : "text-[11px] font-medium text-muted-foreground"
              }
            >
              {data.voting_stats.active_sessions > 0
                ? `${data.voting_stats.active_sessions} active`
                : "No active elections"}
            </span>
          </div>
        </div>
      </div>

      {/* Compact 3-stat strip */}
      <div className="animate-slide-up-1 grid grid-cols-3 divide-x rounded-2xl border">
        {[
          { label: "Votes cast", value: data.voting_stats.total_votes_cast, icon: Vote },
          { label: "Eligible", value: data.voting_stats.eligible_sessions, icon: ShieldCheck },
          { label: "Active now", value: data.voting_stats.active_sessions, icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 px-3 py-3">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Support email */}
      {data.tenant?.branding?.support_email ? (
        <PortalStackCard className="animate-slide-up-1 flex items-center gap-2.5 py-3">
          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Support:{" "}
            <a
              href={`mailto:${data.tenant.branding.support_email}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {data.tenant.branding.support_email}
            </a>
          </p>
        </PortalStackCard>
      ) : null}

      {/* First-login password banner */}
      {data.student_info.first_login ? (
        <Card className="animate-slide-up-1 border-amber-300/60 bg-amber-50/60 shadow-none dark:border-amber-700/40 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Set a personal password</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                You&apos;re still on your temporary password.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 rounded-xl">
              <Link href="/students/create-password?ref=/students/home">Update</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Elections — primary content */}
      <section className="animate-slide-up-2 flex flex-col gap-3">
        <PortalSectionHeader
          title="Your elections"
          description="Active ones need your vote now."
          icon={Vote}
          action={
            <Link
              href="/students/elections"
              className="text-xs font-medium text-foreground underline underline-offset-4"
            >
              View all
            </Link>
          }
        />
        <div className="flex flex-col gap-3">
          {data.sessions.eligible.length > 0 ? (
            data.sessions.eligible.map((session) => (
              <StudentSessionCard
                key={session._id}
                session={{
                  ...session,
                  description: "",
                  candidate_count: 0,
                  is_off_campus_allowed: false,
                }}
                href={
                  session.has_voted
                    ? `/students/vote/${session._id}/submitted`
                    : `/students/elections/${session._id}`
                }
                ctaLabel={
                  session.status === "active" ? "Open election" : "View election"
                }
                compact
              />
            ))
          ) : (
            <PortalEmptyState
              icon={Vote}
              title="No elections available"
              description="There are no elections currently available for your profile."
            />
          )}
        </div>
      </section>

      {/* Notifications — secondary */}
      <section className="animate-slide-up-3">
        <Card className="border shadow-none">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {data.notifications.length > 0 ? (
              data.notifications.map((notification) => (
                <div
                  key={notification.type}
                  className="flex items-start gap-2.5 rounded-lg border p-3"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {notification.priority}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500/60" />
                <p className="text-sm text-muted-foreground">All caught up</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PortalPage>
  );
}
