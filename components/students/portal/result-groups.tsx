"use client";

import { Medal, Trophy } from "lucide-react";
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
      <div className="flex flex-col items-center gap-2 rounded-2xl border py-10 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Results will appear here once votes are available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const leader = group.candidates[0];
        const rest = group.candidates.slice(1);

        return (
          <div key={group.position} className="overflow-hidden rounded-2xl border">
            {/* Position header */}
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">{group.position}</p>
              <p className="text-[11px] text-muted-foreground">{group.total_votes} votes cast</p>
            </div>

            <div className="space-y-2.5 p-3">
              {/* Leader card */}
              {leader ? (
                <div className="rounded-xl border p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Trophy className="h-3 w-3" />
                        {leader.is_winner ? "Winner" : "Leading"}
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
                          {leader.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {leader.vote_count} vote{leader.vote_count !== 1 ? "s" : ""} counted
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border px-3 py-2.5 text-right">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        Vote share
                      </p>
                      <p className="font-display mt-0.5 text-2xl font-semibold text-foreground">
                        {leader.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(leader.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Rest of candidates */}
              {rest.length > 0 ? (
                <div className="divide-y overflow-hidden rounded-xl border">
                  {rest.map((candidate, index) => {
                    const rank = index + 2;
                    return (
                      <div
                        key={`${group.position}-${candidate.name}`}
                        className="flex items-center gap-3 px-3.5 py-3"
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            rank === 2 ? "border-primary/30 text-primary" : "text-muted-foreground",
                          )}
                        >
                          {rank === 2 ? <Medal className="h-3.5 w-3.5" /> : rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {candidate.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                                style={{ width: `${Math.min(candidate.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {candidate.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">{candidate.vote_count}v</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
