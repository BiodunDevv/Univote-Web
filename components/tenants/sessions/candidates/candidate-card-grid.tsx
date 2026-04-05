"use client";

import { Eye, Pencil, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SessionCandidate } from "@/types/session";

type CandidateCardGridProps = {
  candidates: SessionCandidate[];
  canEdit: boolean;
  canCreate: boolean;
  onView: (candidate: SessionCandidate) => void;
  onEdit: (candidate: SessionCandidate) => void;
  onCreate: () => void;
};

export function CandidateCardGrid({
  candidates,
  canEdit,
  canCreate,
  onView,
  onEdit,
  onCreate,
}: CandidateCardGridProps) {
  if (candidates.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
          <UserPlus className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No candidates added yet
            </p>
            <p className="text-xs text-muted-foreground">
              Start building the ballot by adding the first candidate.
            </p>
          </div>
          {canCreate ? (
            <Button type="button" variant="outline" onClick={onCreate}>
              Add Candidate
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {candidates.map((candidate, index) => {
        const key = candidate._id || candidate.client_id || `${candidate.name}-${index}`;
        return (
          <Card
            key={key}
            className="group border shadow-none transition-colors hover:border-primary/40"
          >
            <CardContent className="space-y-4 p-4">
              <button
                type="button"
                onClick={() => onView(candidate)}
                className="block w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                    {candidate.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name || "Candidate"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {candidate.name || "Unnamed candidate"}
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {candidate.position || "No category selected"}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {candidate.manifesto || candidate.bio || "No profile details yet."}
                    </p>
                  </div>
                </div>
              </button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onView(candidate)}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  View
                </Button>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit(candidate)}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
