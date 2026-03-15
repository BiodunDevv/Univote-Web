"use client";

import { useParams } from "next/navigation";
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
            <Badge variant="outline" className="text-[11px]">{session.status}</Badge>
            <Badge variant="outline" className="text-[11px]">{isLive ? "Live tally" : "Final tally"}</Badge>
          </div>
        }
        title={session.title}
        description={session.description || "No session description provided."}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Eligibility scope
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {session.eligibility_scope.summary}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Participation
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {session.has_voted ? "Your vote has been recorded" : "You did not vote in this session"}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tally type
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {isLive ? "Live tally in progress" : "Final published tally"}
            </p>
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
