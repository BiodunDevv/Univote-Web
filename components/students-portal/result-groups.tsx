"use client";

import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid gap-4">
      {groups.map((group) => (
        <Card key={group.position} className="border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{group.position}</CardTitle>
              <Badge variant="outline">{group.total_votes} total votes</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.candidates.map((candidate) => (
              <div
                key={`${group.position}-${candidate.name}`}
                className="rounded-2xl border bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {candidate.name}
                      </p>
                      {candidate.is_winner || candidate.is_leading ? (
                        <Badge className="gap-1">
                          <Trophy className="h-3.5 w-3.5" />
                          {candidate.is_winner ? "Winner" : "Leading"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {candidate.vote_count} votes counted
                    </p>
                  </div>
                  <Badge variant="outline">{candidate.percentage}%</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
