"use client";

import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Layers3, Trophy, Users, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { ResultGroups } from "@/components/students/portal/result-groups";
import {
  useStudentFinalResultsQuery,
  useStudentLiveResultsQuery,
  useStudentSessionDetailQuery,
} from "@/lib/queries/student";
import { formatDateTime } from "@/components/students/portal/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

  const positionEntries = Object.entries(session.candidates_by_position || {});
  const totalCandidates = positionEntries.reduce((n, [, c]) => n + c.length, 0);

  return (
    <PortalPage>
      {/* Hero — matches elections/home dot-grid style */}
      <div className="animate-slide-up relative overflow-hidden rounded-2xl border px-5 py-5">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="res-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#res-dots)" />
        </svg>

        <div className="relative space-y-3">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                isLive
                  ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              {isLive ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> : null}
              <span className="capitalize">{session.status}</span>
            </span>
            <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {isLive ? "Live tally" : "Final tally"}
            </span>
            {session.has_voted ? (
              <span className="flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                You voted
              </span>
            ) : null}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              {session.title}
            </h1>
            {session.description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            ) : null}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDateTime(session.start_time)} — {formatDateTime(session.end_time)}
            </span>
            {totalCandidates > 0 ? (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""} · {positionEntries.length} position{positionEntries.length !== 1 ? "s" : ""}
              </span>
            ) : null}
            {session.eligibility_scope?.summary ? (
              <span className="flex items-center gap-1.5">
                <Layers3 className="h-3.5 w-3.5 shrink-0" />
                {session.eligibility_scope.summary}
              </span>
            ) : null}
          </div>

          {/* CTA — ballot or submitted */}
          {session.has_voted ? (
            <Button asChild size="sm" variant="outline" className="rounded-xl w-full sm:w-auto">
              <Link href={`/students/vote/${session.id}/submitted`}>View submitted ballot</Link>
            </Button>
          ) : null}
        </div>
      </div>

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

      <div className="animate-slide-up-1 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm text-muted-foreground">
        <Vote className="h-4 w-4 shrink-0 text-primary" />
        {isLive
          ? "Live tallies update while the election is active."
          : "Final standings are locked after the election closes."}
      </div>
    </PortalPage>
  );
}
