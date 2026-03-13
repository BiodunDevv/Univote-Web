"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Edit,
  Eye,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { SessionOverviewCards } from "@/components/sessions/list/session-overview-cards";

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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2 p-0">
      <div className="rounded-xl border bg-card/60 p-4 shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground">
              Session Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Create, monitor, and maintain voting sessions.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/sessions/create")}
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        </div>
      </div>

      <SessionOverviewCards overview={sessionSummary ?? undefined} />

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

      <Card className="border shadow-none">
        <CardContent className="flex items-center gap-3 p-3">
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
        </CardContent>
      </Card>

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

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card
                key={session._id}
                className="border shadow-none transition-colors hover:border-primary/40"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-sm font-semibold">
                      {session.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getStatusColor(session.status)}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  {session.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {session.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {new Date(session.start_time).toLocaleDateString()} -{" "}
                        {new Date(session.end_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">
                        {formatLocation(session.location)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{session.students_voted || 0} students voted</span>
                    </div>
                  </div>

                  <div className="border-t pt-2.5">
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      {session.categories?.length || 0} categories •{" "}
                      {session.candidates?.length || 0} candidates
                    </p>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </Button>
                    {session.status !== "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            router.push(
                              `/dashboard/sessions/${session._id}/edit`,
                            )
                          }
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            handleDelete(session._id, session.title)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!sessionsQuery.isLoading && sessions.length === 0 && (
            <Card className="border shadow-none">
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <CardTitle className="mb-1.5 text-sm font-semibold">
                  {statusFilter === "all"
                    ? "No sessions found"
                    : `No ${statusFilter} sessions`}
                </CardTitle>
                <CardDescription className="mb-3 text-xs">
                  {statusFilter === "all"
                    ? "Create your first voting session to get started"
                    : `There are no sessions with status \"${statusFilter}\"`}
                </CardDescription>
                {statusFilter === "all" && (
                  <Button
                    onClick={() => router.push("/dashboard/sessions/create")}
                    className="h-9"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Create Session
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === pagination.pages}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
