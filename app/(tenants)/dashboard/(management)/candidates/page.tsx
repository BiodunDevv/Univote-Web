"use client";

import { useMemo, useState } from "react";
import { Search, Trophy, Users, Vote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  useAdminCandidatesQuery,
  useAdminSessionsQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

const chartConfig = {
  candidates: {
    label: "Candidates",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function CandidatesPage() {
  const { membership } = useAuthStore();
  const canManageCandidates = hasAnyTenantPermission(membership, [
    "sessions.manage",
    "tenant.manage",
  ]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sessionId, setSessionId] = useState("all");
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 100 });
  const candidatesQuery = useAdminCandidatesQuery({
    page: 1,
    limit: 500,
  });

  const candidates = useMemo(
    () => {
      const source = candidatesQuery.data?.candidates ?? [];
      const normalizedSearch = search.trim().toLowerCase();

      return source.filter((candidate) => {
        const matchesSearch =
          !normalizedSearch ||
          candidate.name.toLowerCase().includes(normalizedSearch) ||
          candidate.position.toLowerCase().includes(normalizedSearch) ||
          candidate.session_id.title.toLowerCase().includes(normalizedSearch);
        const matchesStatus =
          status === "all" || candidate.session_id.status === status;
        const matchesSession =
          sessionId === "all" || candidate.session_id._id === sessionId;

        return matchesSearch && matchesStatus && matchesSession;
      });
    },
    [candidatesQuery.data?.candidates, search, sessionId, status],
  );
  const chartData = useMemo(
    () =>
      Object.entries(
        candidates.reduce<Record<string, number>>((acc, candidate) => {
          acc[candidate.position] = (acc[candidate.position] || 0) + 1;
          return acc;
        }, {}),
      ).map(([position, count]) => ({
        position,
        candidates: count,
      })),
    [candidates],
  );

  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + candidate.vote_count,
    0,
  );
  const activeCandidates = candidates.filter(
    (candidate) => candidate.session_id.status === "active",
  ).length;
  const leadingCandidate = useMemo(
    () =>
      [...candidates].sort((left, right) => right.vote_count - left.vote_count)[0] || null,
    [candidates],
  );

  if (sessionsQuery.isLoading || candidatesQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading candidate directory...",
          "Fetching election relationships...",
          "Preparing ballot management view...",
        ]}
      />
    );
  }

  if (!canManageCandidates) {
    return (
      <TenantAccessRestricted
        title="Candidate access restricted"
        subtitle="Your university role does not allow candidate and ballot management."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant ballots"
        icon={<Users className="h-5 w-5" />}
        title="Candidate Directory"
        subtitle="Review who is on each ballot, how positions are distributed, and which elections are pulling the highest vote totals."
        stats={[
          {
            label: "Candidates",
            value: candidates.length.toLocaleString(),
          },
          {
            label: "Elections represented",
            value: new Set(candidates.map((candidate) => candidate.session_id._id)).size.toLocaleString(),
          },
          {
            label: "Votes captured",
            value: totalVotes.toLocaleString(),
          },
          {
            label: "Active ballot entries",
            value: activeCandidates.toLocaleString(),
          },
        ]}
      />

      <TenantSectionCard
        title="Refine the directory"
        description="Search instantly by candidate, position, or election name, then narrow the live directory without refetching."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidates, positions, or elections"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by election status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All election statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by election" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All elections</SelectItem>
              {(sessionsQuery.data?.sessions || []).map((session) => (
                <SelectItem key={session._id} value={session._id}>
                  {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TenantSectionCard>

      <TenantMetricGrid columns={3}>
        <TenantMetricCard
          label="Leading candidate"
          value={leadingCandidate?.name || "No votes yet"}
          hint={
            leadingCandidate
              ? `${leadingCandidate.position} • ${leadingCandidate.vote_count.toLocaleString()} votes`
              : "Once votes arrive, the current leader appears here."
          }
          icon={<Trophy className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Most populated position"
          value={chartData[0]?.position || "No positions"}
          hint={
            chartData[0]
              ? `${chartData[0].candidates.toLocaleString()} candidates`
              : "The directory is currently empty."
          }
          icon={<Users className="h-4 w-4" />}
        />
        <TenantMetricCard
          label="Average votes / candidate"
          value={candidates.length ? Math.round(totalVotes / candidates.length).toLocaleString() : "0"}
          hint="Derived from the current candidate result totals."
          icon={<Vote className="h-4 w-4" />}
        />
      </TenantMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <TenantSectionCard
          title="Positions coverage"
          description="A quick shadcn chart view of how candidate slots are distributed."
        >
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="position"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="candidates" fill="var(--color-candidates)" radius={10} />
              </BarChart>
            </ChartContainer>
          ) : (
            <TenantEmptyState
              icon={Users}
              title="No candidate distribution yet"
              description="Once candidates are attached to elections, this chart will show how the ballot is shaped."
            />
          )}
        </TenantSectionCard>

        <TenantSectionCard
          title="Top vote totals"
          description="The highest recorded vote counts across the current filtered candidate list."
        >
          <div className="space-y-3">
            {candidates
              .slice()
              .sort((left, right) => right.vote_count - left.vote_count)
              .slice(0, 5)
              .map((candidate) => (
                <div
                  key={candidate._id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.position} • {candidate.session_id.title}
                      </p>
                    </div>
                    <Badge>{candidate.vote_count.toLocaleString()} votes</Badge>
                  </div>
                </div>
              ))}
          </div>
        </TenantSectionCard>
      </div>

      <TenantSectionCard
        title="Candidate registry"
        description="Card-first ballot registry with live filtering for election, lifecycle, vote totals, and candidate metadata."
      >
        {candidates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {candidates.map((candidate) => (
              <div
                key={candidate._id}
                className="rounded-2xl border border-border/70 bg-background p-4 shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.position}
                    </p>
                  </div>
                  <Badge variant="outline">{candidate.session_id.status}</Badge>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {candidate.bio || "No profile summary added yet."}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Election
                    </p>
                    <p className="mt-1 text-sm font-medium">{candidate.session_id.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(candidate.session_id.start_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Votes
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {candidate.vote_count.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {candidate.session_id.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TenantEmptyState
            icon={Vote}
            title="No candidates matched this view"
            description="Adjust the live filters, or add candidates from an upcoming election editor."
          />
        )}
      </TenantSectionCard>
    </div>
  );
}
