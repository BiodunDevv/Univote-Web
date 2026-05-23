"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  GraduationCap,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAdminSessionLiveQuery } from "@/lib/queries/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { buildPublicAppUrl } from "@/lib/tenant";
import type {
  AdminLiveSessionResponse,
  LiveBreakdownEntry,
} from "@/types/live-session";

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

function BreakdownCard({
  title,
  rows,
  icon,
}: {
  title: string;
  rows: LiveBreakdownEntry[];
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
        <Badge variant="outline" className="rounded-md text-[11px]">
          {rows.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        {rows.length ? (
          rows.map((row) => (
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
                <div>
                  <p className="font-semibold text-foreground">{row.eligible}</p>
                  <p className="text-muted-foreground">Eligible</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{row.voted}</p>
                  <p className="text-muted-foreground">Voted</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{row.not_voted}</p>
                  <p className="text-muted-foreground">Not voted</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            No participation recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CandidateStandings({
  groups,
}: {
  groups: AdminLiveSessionResponse["candidate_standings"];
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Candidate standings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.position} className="rounded-md border">
              <div className="flex items-center justify-between gap-3 border-b p-3">
                <p className="text-sm font-semibold">{group.position}</p>
                <Badge variant="outline" className="rounded-md text-[11px]">
                  {group.total_votes} votes
                </Badge>
              </div>
              <div className="divide-y">
                {group.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"
                  >
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
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Candidate standings will appear once candidates and votes exist.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogs({
  logs,
}: {
  logs: AdminLiveSessionResponse["recent_logs"];
}) {
  return (
    <Card className="rounded-lg border shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Recent verification logs</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {logs.length ? (
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[1.1fr_0.7fr_1fr_1fr_0.8fr] gap-3 border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span>Time</span>
              <span>Result</span>
              <span>Structure</span>
              <span>Reason</span>
              <span>Signals</span>
            </div>
            <div className="divide-y">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-1 gap-2 px-3 py-3 text-sm md:grid-cols-[1.1fr_0.7fr_1fr_1fr_0.8fr] md:gap-3"
                >
                  <span className="text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </span>
                  <span className="flex items-center gap-2 capitalize">
                    {log.result === "accepted" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {log.result}
                  </span>
                  <span className="text-muted-foreground">
                    {log.college} / {log.department} / {log.level}
                  </span>
                  <span className="text-muted-foreground">
                    {log.failure_reason || log.liveness_status || "Accepted"}
                  </span>
                  <span className="text-muted-foreground">
                    Device {log.device_signal}, location {log.location_signal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No verification attempts have been logged for this election yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSessionLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = String(params.id || "");
  const { token, hasHydrated, tenant } = useAuthStore();
  const liveQuery = useAdminSessionLiveQuery(sessionId, {
    enabled: hasHydrated && Boolean(token),
  });
  const data = liveQuery.data;

  const publicUrl = useMemo(() => {
    if (!data?.session.live_public_code || !tenant?.slug) return "";
    return buildPublicAppUrl(
      `/live/${tenant.slug}/${data.session.live_public_code}`,
    );
  }, [data?.session.live_public_code, tenant?.slug]);

  const copyPublicUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Live page link copied");
  };

  if (!hasHydrated || (liveQuery.isLoading && !data)) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading live election...",
          "Reading turnout data...",
          "Preparing audit-safe logs...",
        ]}
      />
    );
  }

  if (!data || liveQuery.error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <Card className="w-full rounded-lg border shadow-none">
          <CardContent className="space-y-4 p-5">
            <p className="text-lg font-semibold">Live page unavailable</p>
            <p className="text-sm text-muted-foreground">
              {liveQuery.error instanceof Error
                ? liveQuery.error.message
                : "This election live page could not be loaded."}
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard/elections")}>
              Back to sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-0">
      <header className="rounded-lg border bg-card p-4 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={statusVariant(data.session.status)}
                className="rounded-md capitalize"
              >
                {data.session.status}
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {data.session.live_public_code || "No public code"}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {data.session.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Live turnout, candidate standings, and audit-safe verification
              events for this election.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/elections/${sessionId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Session
            </Button>
            <Button
              variant="outline"
              onClick={() => void liveQuery.refetch()}
              disabled={liveQuery.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <Card className="rounded-lg border shadow-none">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Public live page</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {publicUrl || "Public link will appear after the election has a live code."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void copyPublicUrl()}
              disabled={!publicUrl}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
            {publicUrl ? (
              <Button asChild variant="outline">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open public page
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open public page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Voted</p>
              <p className="text-xl font-semibold">{data.totals.voted}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Eligible</p>
              <p className="text-xl font-semibold">{data.totals.eligible}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Not voted</p>
              <p className="text-xl font-semibold">{data.totals.not_voted}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Turnout</p>
              <p className="text-xl font-semibold">
                {data.totals.turnout_percentage}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Accepted checks</p>
              <p className="text-xl font-semibold">
                {data.verification_summary.accepted}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="text-sm font-medium">
                {formatDateTime(data.last_updated)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <p className="text-sm font-semibold">Eligibility scope</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Overall eligibility is counted from active students matching this
              session scope.
            </p>
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
        <BreakdownCard
          title="Colleges"
          rows={data.breakdowns.colleges}
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        />
        <BreakdownCard
          title="Departments"
          rows={data.breakdowns.departments}
          icon={<Layers3 className="h-4 w-4 text-muted-foreground" />}
        />
        <BreakdownCard
          title="Levels"
          rows={data.breakdowns.levels}
          icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
        <CandidateStandings groups={data.candidate_standings} />
        <Card className="rounded-lg border shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Verification health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-lg font-semibold">
                  {data.verification_summary.total_attempts}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-lg font-semibold">
                  {data.verification_summary.rejected}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lockouts</p>
                <p className="text-lg font-semibold">
                  {data.verification_summary.lockouts}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Acceptance</p>
                <p className="text-lg font-semibold">
                  {data.verification_summary.acceptance_rate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AuditLogs logs={data.recent_logs} />
    </div>
  );
}
