"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Edit,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "upcoming":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "ended":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
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
        subtitle="Create, review, edit, and retire voting sessions with one consistent operational surface."
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
            description="Table view for lifecycle state, schedule, turnout snapshot, location, and candidate setup."
            contentClassName="space-y-4 overflow-hidden"
          >
            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <div className="hidden w-full max-w-full overflow-x-auto rounded-lg border md:block">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Turnout</TableHead>
                      <TableHead>Setup</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          <p className="text-sm font-semibold">
                            {session.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {session.description || "No description"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(session.status)}
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs">
                            {formatSessionDateTime(session.start_time)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            to {formatSessionDateTime(session.end_time)}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-xs">
                          {formatLocation(session.location)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {(session.students_voted || 0).toLocaleString()}{" "}
                            voted
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(session.total_votes || 0).toLocaleString()}{" "}
                            ballots
                          </p>
                        </TableCell>
                        <TableCell className="text-xs">
                          {(session.categories?.length || 0).toLocaleString()}{" "}
                          categories
                          <br />
                          {(
                            session.candidates?.length || 0
                          ).toLocaleString()}{" "}
                          candidates
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/sessions/${session._id}`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {session.status !== "active" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/sessions/${session._id}/edit`,
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(session._id, session.title)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {visibleSessions.map((session) => (
                <div
                  key={session._id}
                  className="rounded-2xl border border-border/70 bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionDate(session.start_time)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getStatusColor(session.status)}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
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
