"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Search, Trophy, Users, Vote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  useAdminCandidatesQuery,
  useAdminSessionsQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantPageHeader,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import { cn } from "@/lib/utils";

const chartConfig = {
  candidates: { label: "Candidates", color: "var(--chart-2)" },
} satisfies ChartConfig;

function statusClass(status: string) {
  switch (status) {
    case "active": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "upcoming": return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    default: return "border-border text-muted-foreground";
  }
}

export default function CandidatesPage() {
  const { membership } = useAuthStore();
  const canManageCandidates = hasAnyTenantPermission(membership, ["sessions.manage", "tenant.manage"]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sessionId, setSessionId] = useState("all");
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 100 });
  const candidatesQuery = useAdminCandidatesQuery({ page: 1, limit: 500 });

  const candidates = useMemo(() => {
    const source = candidatesQuery.data?.candidates ?? [];
    const term = search.trim().toLowerCase();
    return source.filter((c) => {
      const matchesSearch = !term ||
        c.name.toLowerCase().includes(term) ||
        c.position.toLowerCase().includes(term) ||
        c.session_id.title.toLowerCase().includes(term);
      return matchesSearch &&
        (status === "all" || c.session_id.status === status) &&
        (sessionId === "all" || c.session_id._id === sessionId);
    });
  }, [candidatesQuery.data?.candidates, search, sessionId, status]);

  const chartData = useMemo(() =>
    Object.entries(
      candidates.reduce<Record<string, number>>((acc, c) => {
        acc[c.position] = (acc[c.position] || 0) + 1;
        return acc;
      }, {}),
    ).map(([position, count]) => ({ position, candidates: count })),
    [candidates],
  );

  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);
  const activeCandidates = candidates.filter((c) => c.session_id.status === "active").length;
  const leadingCandidate = useMemo(
    () => [...candidates].sort((a, b) => b.vote_count - a.vote_count)[0] || null,
    [candidates],
  );

  if (sessionsQuery.isLoading || candidatesQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading candidates…", "Fetching election relationships…"]} />;
  }

  if (!canManageCandidates) {
    return <TenantAccessRestricted title="Candidate access restricted" subtitle="Your role does not allow candidate management." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Ballot management"
        icon={<Users className="h-5 w-5" />}
        title="Candidates"
        subtitle="Review who is on each ballot, position distribution, and vote totals."
        stats={[
          { label: "Candidates", value: candidates.length.toLocaleString() },
          { label: "Elections", value: new Set(candidates.map((c) => c.session_id._id)).size.toLocaleString() },
          { label: "Votes captured", value: totalVotes.toLocaleString() },
          { label: "Active entries", value: activeCandidates.toLocaleString() },
        ]}
      />

      {/* Inline filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates, positions, or elections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sessionId} onValueChange={setSessionId}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-48">
            <SelectValue placeholder="Election" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All elections</SelectItem>
            {(sessionsQuery.data?.sessions || []).map((s) => (
              <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts row */}
      {chartData.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Positions coverage</p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="position" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="candidates" fill="var(--color-candidates)" radius={6} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Top vote totals</p>
            <div className="space-y-2">
              {candidates
                .slice()
                .sort((a, b) => b.vote_count - a.vote_count)
                .slice(0, 5)
                .map((c, i) => (
                  <div key={c._id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.position}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">{c.vote_count.toLocaleString()}</span>
                  </div>
                ))}
              {leadingCandidate ? (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  Leading: {leadingCandidate.name} · {leadingCandidate.vote_count.toLocaleString()} votes
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Table */}
      {candidates.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="hidden md:table-cell">Election</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Votes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {c.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photo_url} alt={c.name} className="h-7 w-7 shrink-0 rounded-md border object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="max-w-40 truncate text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{c.position}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="max-w-40 truncate text-xs text-muted-foreground">{c.session_id.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize text-[11px]", statusClass(c.session_id.status))}>
                      {c.session_id.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium tabular-nums">{c.vote_count.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <TenantEmptyState
          icon={Vote}
          title="No candidates matched"
          description="Adjust the filters, or add candidates from an upcoming election editor."
        />
      )}
    </div>
  );
}
