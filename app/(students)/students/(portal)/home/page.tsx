"use client";

import Link from "next/link";
import { Bell, Building2, Clock3, Mail, ShieldCheck, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalSectionHeader,
  PortalStackCard,
  PortalStatsGrid,
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

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your portal...",
          "Checking available sessions...",
          "Refreshing your voting history...",
        ]}
      />
    );
  }

  if (error || !data) {
    return (
      <PortalEmptyState
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

  const cards = [
    {
      label: "Votes cast",
      value: data.voting_stats.total_votes_cast,
      helper: "Completed ballot sessions",
      icon: Vote,
    },
    {
      label: "Eligible sessions",
      value: data.voting_stats.eligible_sessions,
      helper: "Sessions currently open to you",
      icon: ShieldCheck,
    },
    {
      label: "Active now",
      value: data.voting_stats.active_sessions,
      helper: "Live sessions you can act on",
      icon: Clock3,
    },
  ];

  return (
    <PortalPage>
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span>{participantLabels.singular} overview</span>
            {data.tenant ? (
              <Badge variant="secondary">{data.tenant.name}</Badge>
            ) : null}
          </div>
        }
        title={data.student_info.full_name}
        description={[participantIdentifier, ...participantMeta]
          .filter(Boolean)
          .join(" • ")}
        actions={
          <div className="rounded-2xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <p>Last login</p>
            <p className="mt-1 font-medium text-foreground">
              {data.student_info.last_login
                ? new Date(data.student_info.last_login).toLocaleString()
                : "First session"}
            </p>
          </div>
        }
      />

      {data.tenant ? (
        <PortalStackCard className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {data.tenant.slug}
            </span>
            {data.tenant.branding?.support_email ? (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {data.tenant.branding.support_email}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  data.tenant.branding?.accent_color ||
                  data.tenant.branding?.primary_color ||
                  "currentColor",
              }}
            />
            <span className="text-xs text-muted-foreground">
              {data.tenant.plan_code
                ? `Plan: ${data.tenant.plan_code.replace(/_/g, " ")}`
                : "Tenant workspace"}
            </span>
          </div>
        </PortalStackCard>
      ) : null}

      {data.student_info.first_login ? (
        <Card className="border-amber-300/70 bg-amber-50/60 shadow-none">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Change your temporary password
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You signed in with the default password. Update it now to secure
                your {participantLabels.singular.toLowerCase()} account.
              </p>
            </div>
            <Button asChild>
              <Link href="/students/create-password?ref=/students/home">
                Update password
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <PortalStatsGrid>
        {cards.map((card) => (
          <Card key={card.label} className="border shadow-none">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-2xl border bg-muted p-2.5">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-semibold text-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </PortalStatsGrid>

      <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
        <div className="space-y-4">
          <PortalSectionHeader
            title="Your eligible sessions"
            description="Prioritized so you can move quickly into live ballots."
            action={
              <Link
                href="/students/sessions"
                className="text-xs font-medium text-foreground underline underline-offset-4"
              >
                View all
              </Link>
            }
          />

          <div className="grid gap-4">
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
                  href={`/students/sessions/${session._id}`}
                  ctaLabel={
                    session.status === "active"
                      ? "Open session"
                      : "Review session"
                  }
                  compact
                />
              ))
            ) : (
              <PortalEmptyState
                title="No sessions available"
                description="No sessions are currently available for your profile."
              />
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.notifications.length > 0 ? (
                data.notifications.map((notification) => (
                  <div
                    key={notification.type}
                    className="rounded-2xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {notification.message}
                      </p>
                      <Badge variant="outline">{notification.priority}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  You are all caught up.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent vote activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.voting_history.length > 0 ? (
                data.voting_history.slice(0, 4).map((entry, index) => (
                  <div
                    key={`${entry.session}-${index}`}
                    className="rounded-2xl border bg-muted/20 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {entry.session}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.position}: {entry.candidate}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.voted_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No voting history recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PortalPage>
  );
}
