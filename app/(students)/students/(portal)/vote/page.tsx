"use client";

import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { StudentSessionCard } from "@/components/students-portal/session-card";
import { useStudentSessionsQuery } from "@/lib/queries/student";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Vote</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a session below to open its ballot. Active sessions are shown first.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            There are no active or upcoming sessions available to vote in right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
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
    </div>
  );
}
