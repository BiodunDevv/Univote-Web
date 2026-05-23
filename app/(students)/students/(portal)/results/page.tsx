"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, History, Trophy } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { useStudentSessionsQuery, useStudentVotingHistoryQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            <div className="grid gap-3">
              {resultSessions.map((session) => (
                <Card
                  key={session._id}
                  className="press-scale rounded-2xl border shadow-none transition-colors hover:bg-muted/20"
                >
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {session.status}
                      </Badge>
                      {session.has_voted ? (
                        <Badge variant="outline" className="border-emerald-300/60 bg-emerald-50/50 text-[11px] text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          You voted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px]">
                          View only
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm leading-snug">{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {session.status === "active" ? "Live board available" : "Final board published"} · Ends {formatDateTime(session.end_time)}
                    </p>
                    <Link
                      href={`/students/results/${session._id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {session.status === "active"
                          ? "Live race board is updating"
                          : "Final standings are published"}
                      </p>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyQuery.data?.history?.length ? (
            <div className="grid gap-3">
              {historyQuery.data.history.map((entry) => (
                <Card
                  key={`${entry.session.id}-${entry.voted_at}`}
                  className="rounded-2xl border shadow-none"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm leading-snug">
                        {entry.session.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-300/60 bg-emerald-50/50 text-[11px] text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Recorded
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(entry.voted_at)}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {entry.votes.map((vote) => (
                        <div
                          key={`${entry.session.id}-${vote.position}`}
                          className="rounded-xl border bg-muted/20 px-3 py-2.5"
                        >
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {vote.position}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">
                            {vote.candidate.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
