"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Edit,
  ExternalLink,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminSessionSummaryQuery,
  useAdminSessionsQuery,
  useDeleteSessionMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantPageHeader,
} from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import { cn } from "@/lib/utils";

function getInitialStatusFilter() {
  if (typeof window === "undefined") return "all";
  const s = new URLSearchParams(window.location.search).get("status");
  return s === "active" || s === "upcoming" || s === "ended" ? s : "all";
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "upcoming":
      return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    default:
      return "border-border text-muted-foreground";
  }
}

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function fmtLocation(location: { lat?: number; lng?: number; name?: string; address?: string }) {
  if (location?.name) return location.name;
  if (location?.address) return location.address;
  if (location?.lat && location?.lng) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  return "Not set";
}

function fmtRange(start: string, end: string) {
  return `${fmtDate(start)} - ${fmtDate(end)}`;
}

export default function ElectionsPage() {
  const router = useRouter();
  const { token, hasHydrated, membership } = useAuthStore();
  const canManageSessions = hasAnyTenantPermission(membership, ["sessions.manage", "tenant.manage"]);
  const [statusFilter, setStatusFilter] = useState<string>(getInitialStatusFilter);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const isAuthorized = hasHydrated && Boolean(token);

  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 500 }, { enabled: isAuthorized });
  const sessionSummaryQuery = useAdminSessionSummaryQuery({ enabled: isAuthorized });
  const deleteSession = useDeleteSessionMutation();
  const sessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data?.sessions]);

  const filteredSessions = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!term) return true;
      return [s.title, s.description, s.location?.name, s.location?.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [debouncedSearch, sessions, statusFilter]);

  const pageSize = 20;
  const pagination = useMemo(() => {
    const total = filteredSessions.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return { total, pages, page: Math.min(page, pages), limit: pageSize };
  }, [filteredSessions.length, page]);

  const visibleSessions = useMemo(() => {
    const start = (pagination.page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, pagination.page]);

  const sessionSummary = sessionSummaryQuery.data?.summary;

  useEffect(() => {
    if (!hasHydrated || !token) router.replace("/auth/signin");
  }, [hasHydrated, router, token]);

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteSession.mutateAsync(id);
      toast.success("Election deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete election");
    }
  };

  if (!hasHydrated || !token) return <ChangingLoadingState messages={["Preparing..."]} />;
  if (!canManageSessions) {
    return <TenantAccessRestricted title="Elections access restricted" subtitle="Your role does not allow election management." />;
  }

  const isFirstLoad = (sessionsQuery.isLoading || sessionSummaryQuery.isLoading) && visibleSessions.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        icon={<Vote className="h-5 w-5" />}
        title="Elections"
        subtitle="Create, review, manage, and retire voting elections."
        actions={
          <Button onClick={() => router.push("/dashboard/elections/create")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New election
          </Button>
        }
        stats={[
          { label: "Total", value: sessionSummary?.total_sessions?.toLocaleString() || "0" },
          { label: "Active", value: sessionSummary?.active_sessions?.toLocaleString() || "0" },
          { label: "Upcoming", value: sessionSummary?.upcoming_sessions?.toLocaleString() || "0" },
          { label: "Ended", value: sessionSummary?.ended_sessions?.toLocaleString() || "0" },
        ]}
      />

      {/* Inline filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or location…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFirstLoad ? (
        <ChangingLoadingState messages={["Loading elections…", "Calculating turnout…"]} />
      ) : filteredSessions.length === 0 ? (
        <TenantEmptyState
          icon={Calendar}
          title={statusFilter === "all" ? "No elections found" : `No ${statusFilter} elections`}
          description={
            statusFilter === "all"
              ? "Create your first voting election to start collecting ballots."
              : `There are no elections in the ${statusFilter} state right now.`
          }
          action={
            statusFilter === "all"
              ? { label: "Create election", onClick: () => router.push("/dashboard/elections/create") }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleSessions.map((session) => (
              <Card key={session._id} className="border shadow-none py-0">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("capitalize text-[11px]", statusBadgeClass(session.status))}
                        >
                          {session.status}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {(session.total_votes || 0).toLocaleString()} votes
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-1 text-sm font-semibold text-foreground">
                        {session.title}
                      </p>
                      {session.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {session.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          No election description provided.
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/elections/${session._id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/elections/${session._id}/live`)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Live view
                        </DropdownMenuItem>
                        {session.status !== "ended" ? (
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/elections/${session._id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {session.status !== "active" ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(session._id, session.title)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Schedule
                      </div>
                      <p className="mt-2 text-sm text-foreground">{fmtRange(session.start_time, session.end_time)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Location
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground">{fmtLocation(session.location)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border/70 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Turnout
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                        {(session.total_votes || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Window
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {session.status === "active"
                          ? "Live now"
                          : session.status === "upcoming"
                            ? "Scheduled"
                            : "Completed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => router.push(`/dashboard/elections/${session._id}`)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => router.push(`/dashboard/elections/${session._id}/live`)}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Live
                    </Button>
                    {session.status !== "ended" ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8"
                        onClick={() => router.push(`/dashboard/elections/${session._id}/edit`)}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.pages > 1 ? (
            <TablePaginationControls
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
