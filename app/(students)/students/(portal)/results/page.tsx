"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { useStudentSessionsQuery, useStudentVotingHistoryQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/components/students-portal/utils";

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Results</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review live and final tallies, then switch to your vote history without leaving the page.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line">
          <TabsTrigger value="results">Session results</TabsTrigger>
          <TabsTrigger value="history">Vote history</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          {resultSessions.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                There are no result-ready sessions available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {resultSessions.map((session) => (
                <Card key={session._id} className="border shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{session.status}</Badge>
                      <Badge variant="outline">
                        {session.has_voted ? "You voted" : "Eligible"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
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
                <Card key={`${entry.session.id}-${entry.voted_at}`} className="border shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{entry.session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(entry.voted_at)}
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
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
            <Card className="border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Your vote history will appear here after you submit ballots.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
