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
  Trash2,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  TenantEmptyState,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";

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
  const { token, hasHydrated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const isAuthorized = hasHydrated && Boolean(token);
  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [page, statusFilter],
  );
  const sessionsQuery = useAdminSessionsQuery(filters, { enabled: isAuthorized });
  const sessionSummaryQuery = useAdminSessionSummaryQuery({
    enabled: isAuthorized,
  });
  const deleteSession = useDeleteSessionMutation();
  const sessions = sessionsQuery.data?.sessions ?? [];
  const pagination = sessionsQuery.data?.pagination ?? {
    total: 0,
    page,
    limit: 20,
    pages: 1,
  };
  const sessionSummary = sessionSummaryQuery.data?.summary;

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

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

  const isFirstLoad =
    (sessionsQuery.isLoading || sessionSummaryQuery.isLoading) &&
    sessions.length === 0;
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
        description="Toggle the operational view by lifecycle state before drilling into the session cards."
      >
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">
            Status:
          </label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[190px] text-sm">
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
          {refetching && sessions.length > 0 && (
            <ChangingLoadingState
              messages={REFETCH_LOADING_MESSAGES}
              className="min-h-[140px]"
            />
          )}

          <TenantSectionCard
            title="Session registry"
            description="Operational cards for every configured session, including lifecycle state, turnout snapshot, location, and candidate setup."
            contentClassName="space-y-4"
          >
            <div className="grid gap-3 xl:grid-cols-2">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="rounded-2xl border border-border/70 bg-background p-3 shadow-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {session.title}
                      </p>
                      {session.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {session.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Window
                      </p>
                      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatSessionDateTime(session.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3.5 w-3.5" />
                          <span>{formatSessionDateTime(session.end_time)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Location
                      </p>
                      <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{formatLocation(session.location)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Participation
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {(session.students_voted || 0).toLocaleString()} voted
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(session.total_votes || 0).toLocaleString()} accepted ballots
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Structure
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {(session.categories?.length || 0).toLocaleString()} categories
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(session.candidates?.length || 0).toLocaleString()} candidates
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      Starts {formatSessionDate(session.start_time)}
                    </Badge>
                    <Badge variant="secondary">
                      Ends {formatSessionDate(session.end_time)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/sessions/${session._id}`)}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View
                    </Button>
                    {session.status !== "active" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/sessions/${session._id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(session._id, session.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </TenantSectionCard>

          {!sessionsQuery.isLoading && sessions.length === 0 && (
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
