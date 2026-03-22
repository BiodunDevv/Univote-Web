"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  if (sessionsQuery.isLoading || historyQuery.isLoading) {
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
        description="Review live and final tallies, then switch to your vote history without leaving the page."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-1"
        >
          <TabsTrigger
            value="results"
            className="rounded-xl border border-border/70 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
          >
            Session results
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl border border-border/70 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
          >
            Vote history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          {resultSessions.length === 0 ? (
            <PortalEmptyState
              title="No results yet"
              description="There are no result-ready sessions available yet."
            />
          ) : (
            <div className="grid gap-3">
              {resultSessions.map((session) => (
                <Card key={session._id} className="rounded-[1.5rem] border shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">{session.status}</Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {session.has_voted ? "You voted" : "Eligible"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {session.description || "No description provided."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ends {formatDateTime(session.end_time)}
                    </p>
                    <Link
                      href={`/students/results/${session._id}`}
                      className="inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                    >
                      Open results
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyQuery.data?.history?.length ? (
            <div className="grid gap-4">
              {historyQuery.data.history.map((entry) => (
                <Card key={`${entry.session.id}-${entry.voted_at}`} className="rounded-[1.5rem] border shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{entry.session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(entry.voted_at)}
                    </p>
                    <div className="grid gap-2">
                      {entry.votes.map((vote) => (
                        <div
                          key={`${entry.session.id}-${vote.position}`}
                          className="rounded-2xl border bg-muted/20 p-4"
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
