"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  useAdminCandidatesQuery,
  useAdminSessionsQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sessionId, setSessionId] = useState("all");
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 100 });
  const candidatesQuery = useAdminCandidatesQuery({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    session_id: sessionId !== "all" ? sessionId : undefined,
    page: 1,
    limit: 48,
  });

  const candidates = candidatesQuery.data?.candidates || [];
  const groupedCounts = useMemo(() => {
    return candidates.reduce<Record<string, number>>((acc, candidate) => {
      acc[candidate.position] = (acc[candidate.position] || 0) + 1;
      return acc;
    }, {});
  }, [candidates]);

  if (sessionsQuery.isLoading || candidatesQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading candidate directory...",
          "Fetching session relationships...",
          "Preparing ballot management view...",
        ]}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Candidate Directory
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse candidates across all configured sessions with live ballot metadata.
            </p>
          </div>
        </div>
      </section>

      <Card className="border shadow-none">
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          <Input
            placeholder="Search candidates"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by session status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All session statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sessions</SelectItem>
              {(sessionsQuery.data?.sessions || []).map((session) => (
                <SelectItem key={session._id} value={session._id}>
                  {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {Object.entries(groupedCounts).map(([position, count]) => (
          <Badge key={position} variant="outline">
            {position}: {count}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {candidates.map((candidate) => (
          <Card key={candidate._id} className="border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{candidate.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.position}
                  </p>
                </div>
                <Badge variant="outline">{candidate.session_id.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Session: {candidate.session_id.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Votes recorded: {candidate.vote_count}
              </p>
              {candidate.bio ? (
                <p className="text-sm text-muted-foreground">{candidate.bio}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
