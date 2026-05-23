"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileBarChart2,
  Layers3,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { TenantAccessRestricted } from "@/components/tenants/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useAdminSessionLiveQuery,
  useAdminSessionsQuery,
} from "@/lib/queries/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import type {
  AdminLiveSessionResponse,
  LiveBreakdownEntry,
} from "@/types/live-session";
import type { VotingSession } from "@/types/session";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "upcoming") return "secondary";
  return "outline";
}

function MetricCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  detail?: string;
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md border bg-muted/40 p-2">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold text-foreground">
            {value}
          </p>
          {detail ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {detail}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownPanel({
  title,
  rows,
}: {
  title: string;
  rows: LiveBreakdownEntry[];
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Badge variant="outline" className="rounded-md text-[11px]">
          {rows.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        {rows.length ? (
          rows.slice(0, 8).map((row) => (
            <div key={`${title}-${row.name}`} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">
                  {row.name}
                </p>
                <p className="text-sm font-semibold">
                  {row.turnout_percentage}%
                </p>
              </div>
              <Progress value={row.turnout_percentage} className="mt-2 h-1.5" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <span>
                  <strong className="text-foreground">{row.eligible}</strong>{" "}
                  eligible
                </span>
                <span>
                  <strong className="text-foreground">{row.voted}</strong> voted
                </span>
                <span>
                  <strong className="text-foreground">{row.not_voted}</strong>{" "}
                  not voted
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No eligible groups were found for this breakdown.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CandidateResults({
  groups,
}: {
  groups: AdminLiveSessionResponse["candidate_standings"];
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Candidate results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.position} className="rounded-md border">
              <div className="flex items-center justify-between gap-3 border-b p-3">
                <div>
                  <p className="text-sm font-semibold">{group.position}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.total_votes} valid vote rows
                  </p>
                </div>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="divide-y">
                {group.candidates.map((candidate) => (
                  <div key={candidate.id} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {candidate.name}
                          </p>
                          {candidate.is_leading ? (
                            <Badge className="rounded-md text-[10px]">
                              Leading
                            </Badge>
                          ) : null}
                        </div>
                        <Progress
                          value={candidate.percentage}
                          className="mt-2 h-1.5"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {candidate.vote_count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Candidate results will appear after candidates or votes are added.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionSelector({
  sessions,
  selectedSessionId,
  onSelect,
}: {
  sessions: VotingSession[];
  selectedSessionId: string;
  onSelect: (sessionId: string) => void;
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Elections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        {sessions.map((session) => {
          const isSelected = selectedSessionId === session._id;
          return (
            <button
              key={session._id}
              type="button"
              onClick={() => onSelect(session._id)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">
                  {session.title}
                </p>
                <Badge
                  variant={isSelected ? "secondary" : statusVariant(session.status)}
                  className="rounded-md capitalize"
                >
                  {session.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs opacity-75">
                {formatDateTime(session.start_time)}
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function ElectionAnalyticsPage() {
  const { tenant, membership } = useAuthStore();
  const canViewResults = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
  ]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 100 });
  const [manualSelectedSessionId, setManualSelectedSessionId] = useState("");
  const sessions = useMemo(
    () => sessionsQuery.data?.sessions || [],
    [sessionsQuery.data?.sessions],
  );
  const selectedSessionId = manualSelectedSessionId || sessions[0]?._id || "";
  const liveQuery = useAdminSessionLiveQuery(selectedSessionId, {
    enabled: canViewResults && Boolean(selectedSessionId),
  });
  const data = liveQuery.data;

  if (!canViewResults) {
    return (
      <TenantAccessRestricted
        title="Election results restricted"
        subtitle="Your university role does not allow result and turnout access."
      />
    );
  }

  if (sessionsQuery.isLoading || (selectedSessionId && liveQuery.isLoading)) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading election results...",
          "Calculating eligible turnout...",
          "Preparing candidate standings...",
        ]}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <header className="rounded-lg border bg-card p-4 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="rounded-md">
                Results
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Session Results
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review turnout, eligibility, candidate standings, and verification
              health for each election.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void liveQuery.refetch()}
            disabled={!selectedSessionId || liveQuery.isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {sessions.length ? (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <SessionSelector
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelect={setManualSelectedSessionId}
          />

          {data ? (
            <div className="space-y-4">
              <Card className="rounded-lg border shadow-none">
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={statusVariant(data.session.status)}
                        className="rounded-md capitalize"
                      >
                        {data.session.status}
                      </Badge>
                      <Badge variant="outline" className="rounded-md">
                        {data.session.live_public_code}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight">
                      {data.session.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDateTime(data.session.start_time)} to{" "}
                      {formatDateTime(data.session.end_time)}
                    </p>
                  </div>
                  <div className="min-w-52 rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Overall turnout
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {data.totals.turnout_percentage}%
                    </p>
                    <Progress
                      value={data.totals.turnout_percentage}
                      className="mt-3 h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  label={`Eligible ${participantLabels.plural.toLowerCase()}`}
                  value={data.totals.eligible}
                  icon={<Layers3 className="h-4 w-4" />}
                />
                <MetricCard
                  label="Voted"
                  value={data.totals.voted}
                  icon={<Users className="h-4 w-4" />}
                />
                <MetricCard
                  label="Not voted"
                  value={data.totals.not_voted}
                  icon={<Clock3 className="h-4 w-4" />}
                />
                <MetricCard
                  label="Vote rows"
                  value={data.totals.vote_rows || 0}
                  detail="Multi-position ballots"
                  icon={<BarChart3 className="h-4 w-4" />}
                />
                <MetricCard
                  label="Accepted checks"
                  value={data.verification_summary.accepted}
                  detail={`${data.verification_summary.acceptance_rate}% accepted`}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              </section>

              <Card className="rounded-lg border shadow-none">
                <CardContent className="grid gap-3 p-4 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">Eligibility</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Counts are based on active eligible students.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.eligibility.tenant_wide ? (
                      <Badge variant="outline" className="rounded-md">
                        All active students
                      </Badge>
                    ) : (
                      <>
                        {data.eligibility.college ? (
                          <Badge variant="outline" className="rounded-md">
                            {data.eligibility.college}
                          </Badge>
                        ) : null}
                        {data.eligibility.departments.map((department) => (
                          <Badge
                            key={`department-${department}`}
                            variant="outline"
                            className="rounded-md"
                          >
                            {department}
                          </Badge>
                        ))}
                        {data.eligibility.levels.map((level) => (
                          <Badge
                            key={`level-${level}`}
                            variant="outline"
                            className="rounded-md"
                          >
                            {level} level
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <section className="grid gap-3 lg:grid-cols-3">
                <BreakdownPanel
                  title="College turnout"
                  rows={data.breakdowns.colleges}
                />
                <BreakdownPanel
                  title="Department turnout"
                  rows={data.breakdowns.departments}
                />
                <BreakdownPanel
                  title="Level turnout"
                  rows={data.breakdowns.levels}
                />
              </section>

              <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                <CandidateResults groups={data.candidate_standings} />
                <Card className="rounded-lg border shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Verification summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 p-4 pt-2">
                    {[
                      ["Attempts", data.verification_summary.total_attempts],
                      ["Accepted", data.verification_summary.accepted],
                      ["Rejected", data.verification_summary.rejected],
                      ["Lockouts", data.verification_summary.lockouts],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-lg font-semibold">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          ) : (
            <Card className="rounded-lg border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Select a session to inspect its results.
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="rounded-lg border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No elections are available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
