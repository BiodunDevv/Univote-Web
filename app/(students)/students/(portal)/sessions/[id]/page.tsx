"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Layers3,
  MapPin,
  Vote,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalSectionHeader,
} from "@/components/students/portal/portal-page";
import { formatDateTime } from "@/components/students/portal/utils";
import { useStudentSessionDetailQuery } from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const truncate = (value: string | undefined, length: number) => {
  if (!value || value.length <= length) return value || "";
  return `${value.slice(0, length - 3)}...`;
};

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
      <PortalEmptyState
        title="Session unavailable"
        description={
          (error as Error | undefined)?.message ||
          "Session could not be loaded."
        }
      />
    );
  }

  const primaryAction =
    session.status === "active" && session.eligible && !session.has_voted
      ? {
          href: `/students/vote/${session.id}`,
          label: "Start voting",
        }
      : session.has_voted
        ? {
            href: `/students/results/${session.id}`,
            label: "Vote already recorded",
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

  const positionEntries = Object.entries(session.candidates_by_position || {});
  const totalCandidates = positionEntries.reduce(
    (count, [, candidates]) => count + candidates.length,
    0,
  );

  const statusVariant: "default" | "secondary" | "outline" =
    session.status === "active"
      ? "default"
      : session.status === "upcoming"
        ? "secondary"
        : "outline";

  return (
    <PortalPage>
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant} className="text-[11px] capitalize">
              {session.status}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {session.has_voted ? "Vote submitted" : "Pending vote"}
            </Badge>
          </div>
        }
        title={session.title}
        description={session.description || "No session description provided."}
        actions={
          <Button asChild size="sm">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Candidates</p>
            <p className="text-base font-semibold text-foreground">
              {totalCandidates}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Positions</p>
            <p className="text-base font-semibold text-foreground">
              {positionEntries.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Starts</p>
            <p className="text-xs font-medium text-foreground">
              {formatDateTime(session.start_time)}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="space-y-1 p-3">
            <p className="text-[11px] text-muted-foreground">Ends</p>
            <p className="text-xs font-medium text-foreground">
              {formatDateTime(session.end_time)}
            </p>
          </CardContent>
        </Card>
      </section>

      {!session.eligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {session.eligibility_reason ||
              "You are not eligible for this session."}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Start</p>
              <p className="text-sm font-medium text-foreground">
                {formatDateTime(session.start_time)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">End</p>
              <p className="text-sm font-medium text-foreground">
                {formatDateTime(session.end_time)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <Layers3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Access scope</p>
              <p className="text-sm font-medium text-foreground">
                {session.eligibility_scope.summary}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3.5">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Voting location</p>
              <p className="text-sm font-medium text-foreground">
                {session.is_off_campus_allowed
                  ? "Off-campus voting enabled"
                  : "Geofence enforced"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border shadow-none">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Eligibility</CardTitle>
              <Badge variant={session.eligible ? "default" : "destructive"}>
                {session.eligible ? "You can vote" : "Not eligible"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {session.eligibility_scope.summary}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-[11px]">
                {session.eligibility_scope.tenant_wide
                  ? "Tenant wide"
                  : "Scoped"}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {session.is_off_campus_allowed
                  ? "Off-campus allowed"
                  : "Geofence required"}
              </Badge>
              {session.eligible ? (
                <Badge variant="outline" className="text-[11px]">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Eligible now
                </Badge>
              ) : null}
            </div>

            {!session.eligibility_scope.tenant_wide ? (
              <>
                <Separator />
                <div className="space-y-2.5 text-sm">
                  {session.eligibility_scope.college ? (
                    <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        College
                      </p>
                      <p className="font-medium text-foreground">
                        {session.eligibility_scope.college}
                      </p>
                    </div>
                  ) : null}

                  {session.eligibility_scope.departments.length > 0 ? (
                    <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Departments
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {session.eligibility_scope.departments.map(
                          (department) => (
                            <Badge
                              key={department}
                              variant="outline"
                              className="text-[11px]"
                            >
                              {department}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {session.eligibility_scope.levels.length > 0 ? (
                    <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Levels
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {session.eligibility_scope.levels.map((level) => (
                          <Badge
                            key={level}
                            variant="outline"
                            className="text-[11px]"
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <PortalSectionHeader
          title="Ballot preview"
          description="Browse the candidates grouped by position before you cast a vote."
        />

        <div className="grid gap-2.5">
          {positionEntries.map(([position, candidates]) => (
            <Card key={position} className="border shadow-none">
              <CardHeader className="px-3 py-3">
                <div>
                  <CardTitle className="text-sm">{position}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {candidates.length}{" "}
                    {candidates.length === 1 ? "candidate" : "candidates"}
                  </p>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-3">
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      className="w-[80vw] min-w-[80vw] max-w-sm shrink-0 snap-start rounded-xl border bg-card shadow-none sm:w-[320px] sm:min-w-[320px]"
                    >
                      <CardContent className="flex h-full flex-col gap-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {candidate.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {position}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                Candidate
                              </Badge>
                            </div>

                            <div className="overflow-hidden rounded-xl border bg-muted">
                              {candidate.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={candidate.photo_url}
                                  alt={candidate.name}
                                  className="aspect-4/3 w-full object-cover"
                                />
                              ) : (
                                <div className="flex aspect-4/3 w-full items-center justify-center text-xs text-muted-foreground">
                                  No photo uploaded
                                </div>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {truncate(
                                candidate.bio || "No biography submitted.",
                                140,
                              )}
                            </p>

                            {candidate.manifesto ? (
                              <div className="rounded-lg border bg-background/80 px-3 py-2">
                                <p className="mb-1 text-xs font-medium text-foreground">
                                  Manifesto
                                </p>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {truncate(candidate.manifesto, 200)}
                                </p>
                              </div>
                            ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {positionEntries.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No candidates yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Candidates have not been published for this session.
                  </p>
                </div>
                <Vote className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </PortalPage>
  );
}
