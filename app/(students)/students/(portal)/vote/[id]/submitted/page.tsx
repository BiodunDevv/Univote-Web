"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart2, CheckCircle2, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { formatDateTime } from "@/components/students/portal/utils";
import { useStudentSubmittedBallotQuery } from "@/lib/queries/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentSubmittedBallotPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSubmittedBallotQuery(sessionId);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your submitted ballot...",
          "Checking your recorded selections...",
          "Preparing your ballot receipt...",
        ]}
      />
    );
  }

  const ballot = data?.ballot;

  if (!ballot || error) {
    return (
      <PortalPage>
        <PortalEmptyState
          title="Submitted ballot unavailable"
          description={
            (error as Error | undefined)?.message ||
            "We could not load your submitted ballot for this election."
          }
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage className="space-y-4">
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="text-[11px]">
              Submitted
            </Badge>
            <Badge variant="outline" className="text-[11px] capitalize">
              {ballot.session.status}
            </Badge>
          </div>
        }
        title={ballot.session.title}
        description={
          ballot.session.description ||
          "This is the final receipt of the candidates you submitted for this election."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/students/vote">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Vote center
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link href={`/students/results/${ballot.session.id}`}>
                <BarChart2 className="mr-1.5 h-4 w-4" />
                View results
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary chips */}
      <div className="animate-slide-up-1 grid grid-cols-2 gap-2.5">
        <Card className="border shadow-none">
          <CardContent className="space-y-0.5 p-3">
            <p className="text-[11px] text-muted-foreground">Selections</p>
            <p className="text-sm font-semibold text-foreground">{ballot.choices.length}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-0.5 p-3">
            <p className="text-[11px] text-muted-foreground">Submitted</p>
            <p className="text-sm font-semibold text-foreground">
              {ballot.submitted_at ? formatDateTime(ballot.submitted_at) : "Recorded"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation banner */}
      <div className="animate-slide-up-2 flex items-start gap-3 rounded-2xl border border-emerald-300/60 p-4 dark:border-emerald-700/40">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            Your selections were recorded successfully
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This receipt shows every position and candidate that was recorded
            for this election. Keep it for your records.
          </p>
        </div>
      </div>

      {/* Ballot choices */}
      <Card className="animate-slide-up-3 border shadow-none">
        <CardContent className="pt-4 pb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your selections
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ballot.choices.map((choice) => (
              <div
                key={`${choice.position}:${choice.candidate.id}`}
                className="flex items-start gap-3 rounded-xl border p-3.5"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border">
                  {choice.candidate.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.candidate.photo_url}
                      alt={choice.candidate.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Vote className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {choice.position}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground wrap-break-word">
                    {choice.candidate.name}
                  </p>
                  {choice.candidate.bio ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {choice.candidate.bio}
                    </p>
                  ) : null}
                </div>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </PortalPage>
  );
}
