"use client";

import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { StudentSessionCard } from "@/components/students/portal/session-card";
import { useStudentSessionsQuery } from "@/lib/queries/student";

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
        title="Ready ballots"
        description="Choose a session below to open its ballot. Active sessions are shown first."
      />

      {sessions.length === 0 ? (
        <PortalEmptyState
          title="No ready ballots"
          description="There are no active or upcoming sessions available to vote in right now."
        />
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <StudentSessionCard
              key={session._id}
              session={session}
              href={`/students/vote/${session._id}`}
              ctaLabel={session.status === "active" ? "Start voting" : "Review before voting"}
            />
          ))}
        </div>
      )}
    </PortalPage>
  );
}
