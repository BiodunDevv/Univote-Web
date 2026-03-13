"use client";

import Link from "next/link";
import { Bell, Clock3, ShieldCheck, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { StudentSessionCard } from "@/components/students-portal/session-card";
import { useStudentDashboardQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentHomePage() {
  const { data, isLoading, error } = useStudentDashboardQuery();

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your student dashboard...",
          "Checking available sessions...",
          "Refreshing your voting history...",
        ]}
      />
    );
  }

  if (error || !data) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(error as Error | undefined)?.message ||
            "Student dashboard is unavailable right now."}
        </CardContent>
      </Card>
    );
  }

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
    <div className="space-y-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline">Student overview</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {data.student_info.full_name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.student_info.matric_no} • {data.student_info.department} • Level{" "}
                {data.student_info.level}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            <p>Last login</p>
            <p className="mt-1 font-medium text-foreground">
              {data.student_info.last_login
                ? new Date(data.student_info.last_login).toLocaleString()
                : "First session"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl border bg-muted p-3">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-semibold text-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Your eligible sessions
              </h2>
              <p className="text-sm text-muted-foreground">
                Prioritized so you can move quickly into live ballots.
              </p>
            </div>
            <Link href="/students/sessions" className="text-sm font-medium text-foreground underline underline-offset-4">
              View all
            </Link>
          </div>

          <div className="grid gap-4">
            {data.sessions.eligible.length > 0 ? (
              data.sessions.eligible.map((session) => (
                <StudentSessionCard
                  key={session._id}
                  session={{ ...session, description: "", candidate_count: 0, is_off_campus_allowed: false }}
                  href={`/students/sessions/${session._id}`}
                  ctaLabel={session.status === "active" ? "Open session" : "Review session"}
                  compact
                />
              ))
            ) : (
              <Card className="border shadow-none">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No sessions are currently available for your profile.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
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
                  <div key={`${entry.session}-${index}`} className="rounded-2xl border bg-muted/20 p-4">
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
    </div>
  );
}
