"use client";

import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalStackCard,
} from "@/components/students/portal/portal-page";
import { StudentSessionCard } from "@/components/students/portal/session-card";
import { useStudentSessionsQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";

export default function StudentVoteLandingPage() {
  const activeQuery = useStudentSessionsQuery({ status: "active" });
  const upcomingQuery = useStudentSessionsQuery({ status: "upcoming" });

  if (activeQuery.isLoading || upcomingQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading vote-ready sessions...",
          "Checking active ballots...",
          "Preparing fast access actions...",
        ]}
      />
    );
  }

  const activeSessions = activeQuery.data?.sessions || [];
  const upcomingSessions = upcomingQuery.data?.sessions || [];
  const sessions = activeSessions.length > 0 ? activeSessions : upcomingSessions;

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Vote"
        title="Vote center"
        description="Open an active ballot on your phone for the smoothest voting flow. Upcoming sessions stay here so you can review them early."
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
        {sessions.length === 0 ? (
          <PortalEmptyState
            title="No ready ballots"
            description="There are no active or upcoming sessions available to vote in right now."
          />
        ) : (
          <div className="grid gap-2.5">
            {sessions.map((session) => (
              <StudentSessionCard
                key={session._id}
                session={session}
                href={
                  session.has_voted
                    ? `/students/vote/${session._id}/submitted`
                    : `/students/vote/${session._id}`
                }
                compact
                ctaLabel={
                  session.has_voted
                    ? "View submitted ballot"
                    : session.status === "active"
                      ? "Start voting"
                      : "Review before voting"
                }
              />
            ))}
          </div>
        )}

        <PortalStackCard className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Mobile-first voting
          </Badge>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              Use your phone to cast ballots
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              The full ballot flow uses live verification and location capture
              in one smooth mobile experience. Desktop still works for browsing
              sessions, results, and your profile.
            </p>
          </div>
        </PortalStackCard>
      </div>
    </PortalPage>
  );
}
