"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  Building2,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCw,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePublicLiveSessionQuery } from "@/lib/queries/public";
import type { LiveBreakdownEntry } from "@/types/live-session";

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

function BreakdownTable({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: ReactNode;
  rows: LiveBreakdownEntry[];
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
      <CardContent className="p-4 pt-2">
        {rows.length ? (
          <div className="divide-y rounded-md border">
            {rows.map((row) => (
              <div
                key={`${title}-${row.name}`}
                className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.name}
                  </p>
                  <Progress
                    value={row.turnout_percentage}
                    className="mt-2 h-1.5"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 text-right text-xs sm:min-w-48">
                  <div>
                    <p className="font-semibold text-foreground">
                      {row.eligible}
                    </p>
                    <p className="text-muted-foreground">Eligible</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {row.voted}
                    </p>
                    <p className="text-muted-foreground">Voted</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {row.not_voted}
                    </p>
                    <p className="text-muted-foreground">Not yet</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No votes have been recorded for this breakdown yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PublicLiveSessionPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug || "");
  const liveCode = String(params.liveCode || "");
  const liveQuery = usePublicLiveSessionQuery(tenantSlug, liveCode);
  const data = liveQuery.data;

  if (liveQuery.isLoading) {
    return (
      <main className="min-h-svh bg-background p-4">
        <ChangingLoadingState
          fullHeight
          messages={[
            "Loading live election...",
            "Checking public turnout data...",
            "Preparing breakdowns...",
          ]}
        />
      </main>
    );
  }

  if (!data || liveQuery.error) {
    return (
      <main className="min-h-svh bg-background p-4">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <Card className="w-full rounded-lg border shadow-none">
            <CardContent className="space-y-4 p-5">
              <Logo />
              <div>
                <h1 className="text-lg font-semibold">Live election unavailable</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This public live page could not be found or is no longer
                  available.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/">Go home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:py-7">
        <header className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-3">
            <Link href="/" aria-label="Univote home" className="block w-fit">
              <Logo />
            </Link>
            <div>
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
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                {data.session.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {data.organization.name || "University"} turnout overview.
                Candidate standings are not shown on this public page.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void liveQuery.refetch()}
            disabled={liveQuery.isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Voting window</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(data.session.start_time)} to{" "}
                  {formatDateTime(data.session.end_time)}
                </p>
              </div>
              <Badge variant="outline" className="rounded-md">
                {data.session.is_live ? "Updating automatically" : "Election closed"}
              </Badge>
            </div>
            <Progress value={data.totals.turnout_percentage} className="h-2" />
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                Scope:{" "}
                {data.eligibility.tenant_wide
                  ? "All active students"
                  : [
                      data.eligibility.college,
                      ...data.eligibility.departments,
                      ...data.eligibility.levels.map((level) => `${level} level`),
                    ]
                      .filter(Boolean)
                      .join(" / ")}
              </span>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 lg:grid-cols-3">
          <BreakdownTable
            title="Colleges"
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            rows={data.breakdowns.colleges}
          />
          <BreakdownTable
            title="Departments"
            icon={<Layers3 className="h-4 w-4 text-muted-foreground" />}
            rows={data.breakdowns.departments}
          />
          <BreakdownTable
            title="Levels"
            icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
            rows={data.breakdowns.levels}
          />
        </section>
      </div>
    </main>
  );
}
