"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Layers3,
  MapPin,
  Users,
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

export default function StudentElectionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading election details...",
          "Checking your eligibility...",
          "Preparing the ballot preview...",
        ]}
      />
    );
  }

  const session = data?.session;

  if (!session || error) {
    return (
      <PortalEmptyState
        icon={Vote}
        title="Election unavailable"
        description={
          (error as Error | undefined)?.message ||
          "This election could not be loaded."
        }
      />
    );
  }

  const primaryAction =
    session.status === "active" && session.eligible && !session.has_voted
      ? { href: `/students/vote/${session.id}`, label: "Cast your vote" }
      : session.has_voted
        ? { href: `/students/vote/${session.id}/submitted`, label: "View your ballot" }
        : session.status === "ended"
          ? { href: `/students/results/${session.id}`, label: "View results" }
          : null;

  const positionEntries = Object.entries(session.candidates_by_position || {});
  const totalCandidates = positionEntries.reduce(
    (count, [, candidates]) => count + candidates.length,
    0,
  );

  return (
    <PortalPage>
      {/* Hero */}
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                session.status === "active"
                  ? "default"
                  : session.status === "upcoming"
                    ? "secondary"
                    : "outline"
              }
              className="text-[11px] capitalize"
            >
              {session.status}
            </Badge>
            {session.has_voted ? (
              <Badge variant="outline" className="border-emerald-300/60 bg-emerald-50/50 text-[11px] text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Vote submitted
              </Badge>
            ) : null}
          </div>
        }
        title={session.title}
        description={session.description || undefined}
        actions={
          primaryAction ? (
            <Button asChild size="sm" className="rounded-xl">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          ) : null
        }
      />

      {/* Not eligible alert */}
      {!session.eligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {session.eligibility_reason || "You are not eligible to vote in this election."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Key facts — 4 compact chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border shadow-none">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Candidates</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{totalCandidates}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Positions</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{positionEntries.length}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none col-span-2">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Window</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {formatDateTime(session.start_time)} — {formatDateTime(session.end_time)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Eligibility + location — only info students care about */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Card className="border shadow-none">
          <CardContent className="flex items-start gap-3 p-3.5">
            <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Eligibility scope</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {session.eligibility_scope.summary}
              </p>
              {!session.eligibility_scope.tenant_wide ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {session.eligibility_scope.departments.map((d) => (
                    <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                  ))}
                  {session.eligibility_scope.levels.map((l) => (
                    <Badge key={l} variant="outline" className="text-[10px]">Level {l}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-start gap-3 p-3.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Voting location</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {session.is_off_campus_allowed
                  ? "Vote from anywhere — off-campus allowed"
                  : "Must be on campus to vote"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ballot preview */}
      <section className="space-y-3">
        <PortalSectionHeader
          icon={Users}
          title="Ballot preview"
          description="Browse the candidates per position before casting your vote."
        />

        <div className="flex flex-col gap-3">
          {positionEntries.length === 0 ? (
            <PortalEmptyState
              icon={Vote}
              title="No candidates yet"
              description="Candidates have not been published for this election."
            />
          ) : (
            positionEntries.map(([position, candidates]) => (
              <Card key={position} className="border shadow-none">
                <CardHeader className="border-b px-4 py-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {position}
                    <span className="text-xs font-normal text-muted-foreground">
                      {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="w-[76vw] min-w-[76vw] shrink-0 snap-start rounded-xl border bg-muted/20 p-3.5 sm:w-72 sm:min-w-72"
                      >
                        {/* Photo */}
                        <div className="mb-3 overflow-hidden rounded-lg border bg-muted aspect-[4/3]">
                          {candidate.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                        {candidate.bio ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                            {candidate.bio}
                          </p>
                        ) : null}
                        {candidate.manifesto ? (
                          <>
                            <Separator className="my-2.5" />
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Manifesto
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">
                              {candidate.manifesto}
                            </p>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </PortalPage>
  );
}
