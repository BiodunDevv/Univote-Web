"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CalendarDays, MapPin, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { formatDateTime } from "@/components/students-portal/utils";
import { useStudentSessionDetailQuery } from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentSessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading session details...",
          "Checking ballot eligibility...",
          "Preparing candidate overview...",
        ]}
      />
    );
  }

  const session = data?.session;

  if (!session || error) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(error as Error | undefined)?.message || "Session could not be loaded."}
        </CardContent>
      </Card>
    );
  }

  const primaryAction =
    session.status === "active" && session.eligible && !session.has_voted
      ? {
          href: `/students/vote/${session.id}`,
          label: "Open ballot",
        }
      : session.status === "ended"
        ? {
            href: `/students/results/${session.id}`,
            label: "View results",
          }
        : {
            href: "/students/results",
            label: "Browse results",
          };

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{session.status}</Badge>
              <Badge variant="outline">
                {session.has_voted ? "Vote submitted" : "Pending vote"}
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {session.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {session.description || "No session description provided."}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        </div>
      </section>

      {!session.eligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {session.eligibility_reason || "You are not eligible for this session."}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-5">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Start</p>
              <p className="font-medium text-foreground">
                {formatDateTime(session.start_time)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-5">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">End</p>
              <p className="font-medium text-foreground">
                {formatDateTime(session.end_time)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-5">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Voting location</p>
              <p className="font-medium text-foreground">
                {session.is_off_campus_allowed
                  ? "Off-campus voting enabled"
                  : "Geofence enforced"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ballot preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the candidates grouped by position before you cast a vote.
          </p>
        </div>

        <div className="grid gap-4">
          {Object.entries(session.candidates_by_position).map(([position, candidates]) => (
            <Card key={position} className="border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{position}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-2xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-muted">
                        {candidate.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {candidate.bio || "No biography submitted."}
                        </p>
                      </div>
                    </div>
                    {candidate.manifesto ? (
                      <div className="mt-3 rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">
                        {candidate.manifesto}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
