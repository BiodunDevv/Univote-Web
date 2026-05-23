"use client";

import { useParams } from "next/navigation";
import { CheckCircle2, Trophy, Vote } from "lucide-react";
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
          "Checking election visibility...",
          "Preparing candidate tallies...",
        ]}
      />
    );
  }

  if (!session || sessionQuery.error) {
    return (
      <PortalEmptyState
        icon={Trophy}
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
            {session.has_voted ? (
              <Badge variant="outline" className="border-emerald-300/60 bg-emerald-50/50 text-[11px] text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                You voted
              </Badge>
            ) : null}
          </div>
        }
        title={session.title}
        description={session.description || undefined}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      {isLive && liveData ? (
        <ResultGroups groups={liveData.results} />
      ) : null}

      {!isLive && finalData ? (
        <ResultGroups groups={finalData.results} />
      ) : null}

      <div className="animate-slide-up-1 flex items-center gap-2 rounded-2xl border bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <Vote className="h-4 w-4 shrink-0 text-primary" />
        {isLive
          ? "Live tallies update while the election is active."
          : "Final standings are locked after the election closes."}
      </div>
    </PortalPage>
  );
}
