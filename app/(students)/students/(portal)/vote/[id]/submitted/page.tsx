"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Vote,
} from "lucide-react";
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
            "We could not load your submitted ballot for this session."
          }
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage className="space-y-3">
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
          "This is the final receipt of the candidates you submitted for this session."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/students/vote">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Vote center
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/students/results/${ballot.session.id}`}>View results</Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Status</p>
            <p className="text-sm font-semibold text-foreground">Vote recorded</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Selections</p>
            <p className="text-sm font-semibold text-foreground">
              {ballot.choices.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Submitted</p>
            <p className="text-xs font-medium text-foreground">
              {ballot.submitted_at
                ? formatDateTime(ballot.submitted_at)
                : "Recorded"}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Window</p>
            <p className="text-xs font-medium text-foreground">
              {formatDateTime(ballot.session.start_time)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border shadow-none">
        <CardContent className="space-y-4 p-3.5 sm:p-4">
          <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Your selections were submitted successfully
              </p>
              <p className="text-sm leading-5 text-muted-foreground">
                Review the positions and candidates below. This receipt shows the
                ballot that was recorded for this session.
              </p>
            </div>
          </div>

          <div className="grid gap-2.5">
            {ballot.choices.map((choice) => (
              <div
                key={`${choice.position}:${choice.candidate.id}`}
                className="flex items-start gap-3 rounded-xl border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                  {choice.candidate.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.candidate.photo_url}
                      alt={choice.candidate.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Vote className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {choice.position}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-foreground">
                    {choice.candidate.name}
                  </p>
                  {choice.candidate.bio ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {choice.candidate.bio}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-2.5 sm:grid-cols-2">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <Clock3 className="h-4.5 w-4.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Submitted at</p>
              <p className="text-sm font-medium text-foreground">
                {ballot.submitted_at
                  ? formatDateTime(ballot.submitted_at)
                  : "Submission recorded"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <CalendarDays className="h-4.5 w-4.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Session closes</p>
              <p className="text-sm font-medium text-foreground">
                {formatDateTime(ballot.session.end_time)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PortalPage>
  );
}
