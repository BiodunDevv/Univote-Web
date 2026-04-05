"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  Globe,
  Layers3,
  MapPin,
  Plus,
  Search,
  Trash2,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  TenantSectionCard,
} from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import { cn } from "@/lib/utils";

const INITIAL_LOADING_MESSAGES = [
  "Getting all sessions...",
  "Calculating turnout and vote signals...",
  "Preparing session cards...",
  "Finalizing data...",
];

const REFETCH_LOADING_MESSAGES = [
  "Refreshing sessions...",
  "Syncing latest session updates...",
  "Rebuilding session list...",
];

export default function SessionsPage() {
  const router = useRouter();
  const { token, hasHydrated, membership } = useAuthStore();
  const canManageSessions = hasAnyTenantPermission(membership, [
    "sessions.manage",
    "tenant.manage",
  ]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const isAuthorized = hasHydrated && Boolean(token);
  const sessionsQuery = useAdminSessionsQuery(
    { page: 1, limit: 500 },
    {
      enabled: isAuthorized,
    },
  );
  const sessionSummaryQuery = useAdminSessionSummaryQuery({
    enabled: isAuthorized,
  });
  const deleteSession = useDeleteSessionMutation();
  const sessions = sessionsQuery.data?.sessions ?? [];
  const filteredSessions = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return sessions.filter((session) => {
      if (statusFilter !== "all" && session.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      return [
        session.title,
        session.description,
        session.location?.name,
        session.location?.address,
      ]
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
    return {
      total,
      pages,
      page: Math.min(page, pages),
      limit: pageSize,
    };
  }, [filteredSessions.length, page]);
  const visibleSessions = useMemo(() => {
    const start = (pagination.page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, pagination.page]);
  const sessionSummary = sessionSummaryQuery.data?.summary;

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page > pagination.pages) {
      setPage(pagination.pages);
    }
  }, [page, pagination.pages]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete \"${title}\"?`)) return;

    try {
      await deleteSession.mutateAsync(id);
      toast.success("Session deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete session",
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case "upcoming":
        return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "ended":
        return "border-border bg-muted/60 text-muted-foreground";
      default:
        return "border-border bg-muted/60 text-muted-foreground";
    }
  };

  const formatSessionDate = (value: string) => {
    const date = new Date(value);
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day % 100 !== 11
        ? "st"
        : day % 10 === 2 && day % 100 !== 12
          ? "nd"
          : day % 10 === 3 && day % 100 !== 13
            ? "rd"
            : "th";

    const month = new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(date);

    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
  };

  const formatSessionDateTime = (value: string) => {
    const date = new Date(value);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

    return `${formatSessionDate(value)} at ${time}`;
  };

  const formatLocation = (location: {
    lat?: number;
    lng?: number;
    name?: string;
    address?: string;
  }) => {
    if (location?.name) return location.name;
    if (location?.address) return location.address;
    if (location?.lat && location?.lng) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    return "Location not set";
  };

  const getSessionWindowLabel = (session: (typeof sessions)[number]) => {
    if (session.status === "active") return "Voting is live now";
    if (session.status === "upcoming") return "Scheduled to open soon";
    return "Voting window has ended";
  };

  const getEligibilitySummary = (session: (typeof sessions)[number]) => {
    const parts: string[] = [];
    if (session.eligible_college) parts.push(session.eligible_college);
    if (session.eligible_departments?.length) {
      parts.push(
        session.eligible_departments.length === 1
          ? session.eligible_departments[0]
          : `${session.eligible_departments.length} departments`,
      );
    }
    if (session.eligible_levels?.length) {
      parts.push(
        session.eligible_levels.length === 1
          ? `${session.eligible_levels[0]} level`
          : `${session.eligible_levels.length} levels`,
      );
    }
    return parts.length > 0 ? parts.join(" • ") : "All eligible students";
  };

  if (!hasHydrated || !token) {
    return <ChangingLoadingState messages={["Preparing your session..."]} />;
  }

  if (!canManageSessions) {
    return (
      <TenantAccessRestricted
        title="Sessions access restricted"
        subtitle="Your university role does not allow session and ballot management."
      />
    );
  }

  const isFirstLoad =
    (sessionsQuery.isLoading || sessionSummaryQuery.isLoading) &&
    visibleSessions.length === 0;
  const refetching =
    (sessionsQuery.isFetching || sessionSummaryQuery.isFetching) &&
    !isFirstLoad;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-0">
      <TenantPageHeader
        eyebrow="Tenant sessions"
        icon={<Vote className="h-5 w-5" />}
        title="Session Management"
        subtitle="Create, review, manage, and retire voting sessions with one consistent operational surface. Editing is available only while a session is still upcoming."
        actions={
          <Button
            onClick={() => router.push("/dashboard/sessions/create")}
            size="sm"
            className="h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        }
        stats={[
          {
            label: "Total sessions",
            value: sessionSummary?.total_sessions?.toLocaleString() || "0",
          },
          {
            label: "Active",
            value: sessionSummary?.active_sessions?.toLocaleString() || "0",
          },
          {
            label: "Upcoming",
            value: sessionSummary?.upcoming_sessions?.toLocaleString() || "0",
          },
          {
            label: "Ended",
            value: sessionSummary?.ended_sessions?.toLocaleString() || "0",
          },
        ]}
      />

      {sessionsQuery.error || sessionSummaryQuery.error ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-destructive">
              {sessionsQuery.error instanceof Error
                ? sessionsQuery.error.message
                : sessionSummaryQuery.error instanceof Error
                  ? sessionSummaryQuery.error.message
                  : "Failed to refresh sessions"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void Promise.all([
                  sessionsQuery.refetch(),
                  sessionSummaryQuery.refetch(),
                ]);
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <TenantSectionCard
        title="Filter sessions"
        description="Search and filter by lifecycle state without triggering a server refresh on every change."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions by title, description, or location"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full text-sm md:w-[190px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TenantSectionCard>

      {isFirstLoad ? (
        <ChangingLoadingState messages={INITIAL_LOADING_MESSAGES} />
      ) : (
        <>
          {refetching && visibleSessions.length > 0 && (
            <ChangingLoadingState
              messages={REFETCH_LOADING_MESSAGES}
              className="min-h-[140px]"
            />
          )}

          <TenantSectionCard
            title="Session registry"
            description="Card-based registry for lifecycle state, schedule, turnout, eligibility, and candidate setup."
            contentClassName="space-y-4 overflow-hidden"
          >
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleSessions.map((session) => (
                <div
                  key={session._id}
                  className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/70 p-4 shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("capitalize", getStatusColor(session.status))}
                        >
                          {session.status}
                        </Badge>
                        {session.results_public ? (
                          <Badge variant="outline">Results public</Badge>
                        ) : (
                          <Badge variant="outline">Results private</Badge>
                        )}
                      </div>
                      <p className="text-base font-semibold leading-tight text-foreground">
                        {session.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getSessionWindowLabel(session)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-full"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-[0.14em]">
                          Window
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatSessionDateTime(session.start_time)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ends {formatSessionDateTime(session.end_time)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-[0.14em]">
                          Location
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatLocation(session.location)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {session.is_off_campus_allowed
                          ? "Off-campus voting allowed"
                          : "On-campus presence required"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Turnout
                      </p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {(session.students_voted || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        students voted
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Ballots
                      </p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {(session.total_votes || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        accepted ballots
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Setup
                      </p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {(session.candidates?.length || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        candidates across {(session.categories?.length || 0).toLocaleString()} categories
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-border/70 bg-background p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers3 className="h-4 w-4" />
                      <p className="text-xs font-medium uppercase tracking-[0.14em]">
                        Eligibility
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {getEligibilitySummary(session)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
                        <Vote className="h-3 w-3" />
                        {session.categories?.length || 0} ballot categories
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
                        <Globe className="h-3 w-3" />
                        {session.results_public ? "Public results" : "Restricted results"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {session.description || "No session description provided."}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px]"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {session.status === "upcoming" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[120px]"
                        onClick={() =>
                          router.push(`/dashboard/sessions/${session._id}/edit`)
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {session.status !== "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[120px] text-destructive"
                        onClick={() => handleDelete(session._id, session.title)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </TenantSectionCard>

          {!sessionsQuery.isLoading && filteredSessions.length === 0 && (
            <TenantEmptyState
              icon={Calendar}
              title={
                statusFilter === "all"
                  ? "No sessions found"
                  : `No ${statusFilter} sessions`
              }
              description={
                statusFilter === "all"
                  ? "Create your first voting session to start collecting ballots and results."
                  : `There are no sessions in the ${statusFilter} state right now.`
              }
              action={
                statusFilter === "all"
                  ? {
                      label: "Create Session",
                      onClick: () => router.push("/dashboard/sessions/create"),
                    }
                  : undefined
              }
            />
          )}

          {pagination.pages > 1 && (
            <TablePaginationControls
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
