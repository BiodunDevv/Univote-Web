"use client";

import { useParams } from "next/navigation";
import { ArrowUpRight, Medal, Trophy, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { ResultGroups } from "@/components/students/portal/result-groups";
import {
  useStudentFinalResultsQuery,
  useStudentLiveResultsQuery,
  useStudentSessionDetailQuery,
} from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentResultDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const sessionQuery = useStudentSessionDetailQuery(sessionId);
  const session = sessionQuery.data?.session;

  const liveQuery = useStudentLiveResultsQuery(
    sessionId,
    session?.status === "active",
  );
  const finalQuery = useStudentFinalResultsQuery(
    sessionId,
    session?.status === "ended",
  );

  if (sessionQuery.isLoading || (session?.status === "active" && liveQuery.isLoading) || (session?.status === "ended" && finalQuery.isLoading)) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading results...",
          "Checking session visibility...",
          "Preparing candidate tallies...",
        ]}
      />
    );
  }

  if (!session || sessionQuery.error) {
    return (
      <PortalEmptyState
        title="Results unavailable"
        description={
          (sessionQuery.error as Error | undefined)?.message ||
          "Results could not be loaded."
        }
      />
    );
  }

  const isLive = session.status === "active";
  const liveData = liveQuery.data;
  const finalData = finalQuery.data;
  const error = isLive ? liveQuery.error : finalQuery.error;

  return (
    <PortalPage>
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] capitalize">{session.status}</Badge>
            <Badge variant="outline" className="text-[11px]">{isLive ? "Live tally" : "Final tally"}</Badge>
          </div>
        }
        title={session.title}
        description={session.description || "No session description provided."}
        className="p-4 sm:p-5"
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-2.5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="border shadow-none">
            <CardContent className="p-3.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Eligibility scope
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {session.eligibility_scope.summary}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-none">
            <CardContent className="p-3.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Participation
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {session.has_voted ? "Your vote has been recorded" : "You did not vote in this session"}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-none">
            <CardContent className="p-3.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tally type
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isLive ? "Live tally in progress" : "Final published tally"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-3 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {isLive ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <Trophy className="h-4 w-4 text-primary" />}
              {isLive ? "Race snapshot" : "Final board"}
            </div>
            <div className="space-y-3">
              {((isLive ? liveData?.results : finalData?.results) || [])
                .slice(0, 3)
                .map((group, index) => {
                  const leader = group.candidates[0];
                  return (
                    <div key={`${group.position}-${leader?.id || group.position}`} className="rounded-2xl border bg-muted/20 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {group.position}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-foreground">
                            {leader?.name || "No votes yet"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {leader
                              ? `${leader.vote_count} votes • ${leader.percentage}%`
                              : "Results will appear once ballots are counted."}
                          </p>
                        </div>
                        <Badge className="gap-1 rounded-full">
                          {index === 0 ? (
                            <Trophy className="h-3.5 w-3.5" />
                          ) : (
                            <Medal className="h-3.5 w-3.5" />
                          )}
                          {isLive ? "Ahead" : "Top result"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-primary/5 px-3 py-3 text-sm text-muted-foreground">
              <Vote className="h-4 w-4 text-primary" />
              {isLive
                ? "Live tallies update while the session is active."
                : "Final standings are locked after the session closes."}
            </div>
          </CardContent>
        </Card>
      </section>

      {isLive && liveData ? (
        <ResultGroups groups={liveData.results} />
      ) : null}

      {!isLive && finalData ? (
        <ResultGroups groups={finalData.results} />
      ) : null}
    </PortalPage>
  );
}
