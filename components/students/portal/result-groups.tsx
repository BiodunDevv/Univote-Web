"use client";

import { Medal, Minus, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResultCandidate = {
  id?: string;
  name: string;
  vote_count: number;
  percentage: number;
  is_leading?: boolean;
  is_winner?: boolean;
};

type ResultGroup = {
  position: string;
  total_votes: number;
  candidates: ResultCandidate[];
};

export function ResultGroups({ groups }: { groups: ResultGroup[] }) {
  if (groups.length === 0) {
    return (
      <Card className="border shadow-none">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Results will appear here once votes are available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {groups.map((group) => {
        const leader = group.candidates[0];
        const rest = group.candidates.slice(1);

        return (
          <Card key={group.position} className="overflow-hidden rounded-2xl border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{group.position}</CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  {group.total_votes} votes cast
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pb-4">
              {/* Leader card */}
              {leader ? (
                <div className="rounded-2xl border bg-linear-to-br from-primary/8 via-card to-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <Badge className="gap-1.5 rounded-full">
                        <Trophy className="h-3 w-3" />
                        {leader.is_winner ? "Winner" : "Leading"}
                      </Badge>
                      <div>
                        <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                          {leader.name}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {leader.vote_count} vote{leader.vote_count !== 1 ? "s" : ""} counted
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border px-4 py-3 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Vote share
                      </p>
                      <p className="font-display mt-1 text-2xl font-semibold text-foreground">
                        {leader.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(leader.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Rest of candidates */}
              {rest.length > 0 ? (
                <div className="space-y-2">
                  {rest.map((candidate, index) => {
                    const rank = index + 2;
                    return (
                      <div
                        key={`${group.position}-${candidate.name}`}
                        className="rounded-xl border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-muted-foreground",
                                rank === 2 && "text-primary",
                              )}
                            >
                              {rank === 2 ? (
                                <Medal className="h-4 w-4" />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {candidate.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {candidate.vote_count} vote{candidate.vote_count !== 1 ? "s" : ""} · Rank {rank}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {candidate.percentage}%
                            </p>
                            {/* Mini progress */}
                            <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-muted-foreground/40 transition-all"
                                style={{ width: `${Math.min(candidate.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
