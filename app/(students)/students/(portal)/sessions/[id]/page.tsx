"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CalendarDays, Layers3, MapPin, Vote } from "lucide-react";
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
        description={(error as Error | undefined)?.message || "Session could not be loaded."}
      />
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
    <PortalPage>
      <PortalHero
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px]">{session.status}</Badge>
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

      {!session.eligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {session.eligibility_reason || "You are not eligible for this session."}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
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
          <CardContent className="flex items-center gap-3 p-3">
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
          <CardContent className="flex items-center gap-3 p-3">
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
          <CardContent className="flex items-center gap-3 p-3">
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

      {!session.eligibility_scope.tenant_wide ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {session.eligibility_scope.college ? (
            <Card className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Eligible college</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {session.eligibility_scope.college}
              </CardContent>
            </Card>
          ) : null}
          {session.eligibility_scope.departments.length > 0 ? (
            <Card className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Eligible departments</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {session.eligibility_scope.departments.join(", ")}
              </CardContent>
            </Card>
          ) : null}
          {session.eligibility_scope.levels.length > 0 ? (
            <Card className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Eligible levels</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {session.eligibility_scope.levels.join(", ")}
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <PortalSectionHeader
          title="Ballot preview"
          description="Browse the candidates grouped by position before you cast a vote."
        />

        <div className="grid gap-3">
          {Object.entries(session.candidates_by_position).map(([position, candidates]) => (
            <Card key={position} className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{position}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-2xl border bg-muted/20 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border bg-muted">
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
                        <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
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
    </PortalPage>
  );
}
