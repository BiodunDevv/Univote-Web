"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, History, Trophy } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalStackCard,
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
          "Pulling session tallies...",
          "Refreshing vote history...",
        ]}
      />
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Results"
        title="Tallies and history"
        description="Review live races, final standings, and your recorded vote history in one election board."
        className="p-4 sm:p-5"
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            Result boards
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {resultSessions.length}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Live and final election boards available to you.
          </p>
        </PortalStackCard>
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Live races
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {resultSessions.filter((session) => session.status === "active").length}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sessions still updating while voting remains open.
          </p>
        </PortalStackCard>
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Recorded votes
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {historyQuery.data?.history?.length || 0}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Ballots currently visible in your personal history.
          </p>
        </PortalStackCard>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
          <TabsList
            variant="line"
            className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border/70 px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger
              value="results"
              className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
            >
              Session results
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
            >
              Vote history
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="results" className="mt-4">
          {resultSessions.length === 0 ? (
            <PortalEmptyState
              title="No results yet"
              description="There are no result-ready sessions available yet."
            />
          ) : (
            <div className="grid gap-2.5">
              {resultSessions.map((session) => (
                <Card key={session._id} className="rounded-2xl border shadow-none">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {session.status}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {session.has_voted ? "You voted" : "Eligible"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                      {session.description || "No description provided."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full border bg-muted/20 px-2.5 py-1">
                        {session.status === "active" ? "Live board available" : "Final board available"}
                      </span>
                      <span className="rounded-full border bg-muted/20 px-2.5 py-1">
                        {session.has_voted ? "Your vote recorded" : "View-only access"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ends {formatDateTime(session.end_time)}
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Board status
                        </p>
                        <p className="truncate text-sm font-medium text-foreground">
                          {session.status === "active"
                            ? "Live race board is updating"
                            : "Final standings are published"}
                        </p>
                      </div>
                      <Link
                        href={`/students/results/${session._id}`}
                        className="inline-flex shrink-0 items-center rounded-xl border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                      >
                        Open
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyQuery.data?.history?.length ? (
            <div className="grid gap-2.5">
              {historyQuery.data.history.map((entry) => (
                <Card key={`${entry.session.id}-${entry.voted_at}`} className="rounded-2xl border shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">{entry.session.title}</CardTitle>
                      <Badge variant="outline" className="text-[11px]">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Recorded
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <p className="text-[11px] text-muted-foreground">
                      Submitted {formatDateTime(entry.voted_at)}
                    </p>
                    <div className="grid gap-2">
                      {entry.votes.map((vote) => (
                        <div
                          key={`${entry.session.id}-${vote.position}`}
                          className="rounded-2xl border bg-muted/20 p-3"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {vote.position}
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
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
              title="No history yet"
              description="Your vote history will appear here after you submit ballots."
            />
          )}
        </TabsContent>
      </Tabs>
    </PortalPage>
  );
}
