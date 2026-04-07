"use client";

import { ArrowUpRight, Medal, Minus, Trophy } from "lucide-react";
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
        <CardContent className="p-6 text-sm text-muted-foreground">
          Results will appear here once votes are available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2.5 sm:gap-3">
      {groups.map((group) => (
        <Card
          key={group.position}
          className="overflow-hidden rounded-2xl border shadow-none"
        >
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{group.position}</CardTitle>
              <Badge variant="outline" className="text-[11px]">
                {group.total_votes} total votes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.candidates[0] ? (
              <div className="rounded-[1.35rem] border bg-gradient-to-br from-primary/10 via-card to-card p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Badge className="gap-1 rounded-full">
                      <Trophy className="h-3.5 w-3.5" />
                      {group.candidates[0].is_winner ? "Winner" : "Leading"}
                    </Badge>
                    <div>
                      <p className="text-base font-semibold text-foreground sm:text-lg">
                        {group.candidates[0].name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.candidates[0].vote_count} votes counted
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-background/80 px-3.5 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Vote share
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                      {group.candidates[0].percentage}%
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2.5">
              {group.candidates.slice(1).map((candidate, index) => {
                const rank = index + 2;
                const statusLabel =
                  rank === 2
                    ? "Close race"
                    : rank === 3
                      ? "Third place"
                      : "Trailing";

                return (
                  <div
                    key={`${group.position}-${candidate.name}`}
                    className="rounded-2xl border bg-muted/20 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-background text-sm font-semibold",
                            rank === 2 && "text-primary",
                          )}
                        >
                          {rank === 2 ? (
                            <Medal className="h-4 w-4" />
                          ) : rank === 3 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {candidate.name}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Rank {rank} • {candidate.vote_count} votes
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{candidate.percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
