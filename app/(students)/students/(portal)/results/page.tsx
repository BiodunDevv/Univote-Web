"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, History, Trophy } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { useStudentSessionsQuery, useStudentVotingHistoryQuery } from "@/lib/queries/student";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/components/students/portal/utils";

export default function StudentResultsPage() {
  const [tab, setTab] = useState("results");
  const sessionsQuery = useStudentSessionsQuery();
  const historyQuery = useStudentVotingHistoryQuery();

  const resultSessions = useMemo(() => {
    return (sessionsQuery.data?.sessions || []).filter((session) =>
      ["active", "ended"].includes(session.status),
    );
  }, [sessionsQuery.data?.sessions]);

  if (
    (sessionsQuery.isLoading && !sessionsQuery.data) ||
    (historyQuery.isLoading && !historyQuery.data)
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading results workspace...",
          "Pulling election tallies...",
          "Refreshing vote history...",
        ]}
      />
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Results"
        title="Tallies & history"
        description="Review live races, final standings, and your recorded vote history."
      />

      <Tabs value={tab} onValueChange={setTab} className="animate-slide-up-1 w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
          <TabsList
            variant="line"
            className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border/70 px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger
              value="results"
              className="shrink-0 px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
            >
              Session results
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="shrink-0 px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
            >
              Vote history
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="results" className="mt-4">
          {resultSessions.length === 0 ? (
            <PortalEmptyState
              icon={Trophy}
              title="No results yet"
              description="There are no result-ready elections available yet."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              {resultSessions.map((session, idx) => {
                const isActive = session.status === "active";
                return (
                  <Link
                    key={session._id}
                    href={`/students/results/${session._id}`}
                    className={cn(
                      "press-scale group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20",
                      idx < resultSessions.length - 1 && "border-b",
                      isActive && "border-l-[3px] border-l-[var(--student-vote-accent)]",
                    )}
                  >
                    {/* Status dot */}
                    <span
                      className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        isActive ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/30",
                      )}
                    />

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {session.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isActive ? "Live tally updating" : "Final standings published"}
                        {session.has_voted ? " · You voted" : ""}
                      </p>
                    </div>

                    {/* Right */}
                    {session.has_voted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyQuery.data?.history?.length ? (
            <div className="flex flex-col gap-3">
              {historyQuery.data.history.map((entry) => (
                <div
                  key={`${entry.session.id}-${entry.voted_at}`}
                  className="overflow-hidden rounded-2xl border"
                >
                  {/* Session header */}
                  <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{entry.session.title}</p>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{formatDateTime(entry.voted_at)}</span>
                    </div>
                  </div>

                  {/* Vote rows */}
                  <div className="divide-y">
                    {entry.votes.map((vote) => (
                      <div
                        key={`${entry.session.id}-${vote.position}`}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <p className="text-xs text-muted-foreground">{vote.position}</p>
                        <p className="text-sm font-semibold text-foreground">{vote.candidate.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              icon={History}
              title="No history yet"
              description="Your vote history will appear here after you submit ballots."
            />
          )}
        </TabsContent>
      </Tabs>
    </PortalPage>
  );
}
