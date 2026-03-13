"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SessionCandidateManager } from "@/components/sessions/candidates";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  AdminSessionStatsResponse,
  useAdminCollegesQuery,
  useAdminSessionDetailQuery,
  useAdminSessionStatsQuery,
  useCreateCandidateMutation,
  useDeleteCandidateMutation,
  useUpdateCandidateMutation,
} from "@/lib/queries/admin";
import {
  CandidateMutationDto,
  SessionCandidate,
  SessionStats,
  VotingSession,
} from "@/types/session";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClassName(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "ended":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }
}

function adaptSessionStats(data: AdminSessionStatsResponse): SessionStats {
  const grouped = data.candidates.reduce<
    Record<
      string,
      Array<{
        name: string;
        vote_count: number;
        photo_url?: string;
      }>
    >
  >((accumulator, candidate) => {
    const group = accumulator[candidate.position] || [];
    group.push({
      name: candidate.name,
      vote_count: candidate.vote_count,
      photo_url: candidate.photo_url,
    });
    accumulator[candidate.position] = group;
    return accumulator;
  }, {});

  return {
    session: data.session,
    statistics: {
      eligible_students: data.stats.eligible_students,
      total_votes: data.stats.total_votes,
      unique_voters: data.stats.total_votes,
      duplicate_attempts: data.stats.duplicate_attempts,
      rejected_votes: data.stats.rejected_votes,
      turnout_percentage: String(data.stats.turnout_percentage),
    },
    candidates: Object.entries(grouped).map(([category, candidates]) => {
      const categoryVoteTotal = candidates.reduce(
        (sum, candidate) => sum + candidate.vote_count,
        0,
      );

      return {
        category,
        candidates: candidates.map((candidate) => ({
          ...candidate,
          percentage:
            categoryVoteTotal > 0
              ? `${((candidate.vote_count / categoryVoteTotal) * 100).toFixed(1)}%`
              : "0%",
        })),
      };
    }),
  };
}

type SessionDetailsLoadedProps = {
  sessionId: string;
  currentSession: VotingSession;
  sessionStats: SessionStats;
  displayedCandidates: SessionCandidate[];
  categoryCoverage: number;
  canManageCandidates: boolean;
  eligibleDepartmentsByCollege: Array<{
    collegeId: string;
    collegeName: string;
    collegeCode: string;
    departments: Array<{
      _id: string;
      name: string;
    }>;
  }>;
  candidateId: string | null;
  candidateMode: "view" | "edit" | "create" | null;
  router: ReturnType<typeof useRouter>;
  createCandidate: (
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  updateCandidate: (
    candidateId: string,
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  setCandidates: (value: SessionCandidate[] | null) => void;
  handleCandidateSheetStateChange: ({
    open,
    candidateId,
    mode,
  }: {
    open: boolean;
    candidateId: string | null;
    mode: "view" | "edit" | "create" | null;
  }) => void;
};

export default function SessionDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;

  const { token, hasHydrated } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const collegesQuery = useAdminCollegesQuery({}, { enabled: isAuthorized });
  const sessionDetailQuery = useAdminSessionDetailQuery(sessionId, {
    enabled: isAuthorized,
  });
  const sessionStatsQuery = useAdminSessionStatsQuery(sessionId, {
    enabled: isAuthorized,
  });
  const createCandidateMutation = useCreateCandidateMutation(sessionId);
  const updateCandidateMutation = useUpdateCandidateMutation(sessionId);
  const deleteCandidateMutation = useDeleteCandidateMutation(sessionId);
  const [candidateState, setCandidateState] = useState<{
    sessionId: string;
    value: SessionCandidate[] | null;
  }>({
    sessionId,
    value: null,
  });
  const session = sessionDetailQuery.data?.session ?? null;
  const stats = useMemo(
    () =>
      sessionStatsQuery.data ? adaptSessionStats(sessionStatsQuery.data) : null,
    [sessionStatsQuery.data],
  );

  const candidateId = searchParams.get("candidateId");
  const requestedMode = searchParams.get("mode");
  const candidateMode =
    requestedMode === "edit" ||
    requestedMode === "create" ||
    requestedMode === "view"
      ? requestedMode
      : null;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);
  const setCandidates = useCallback(
    (value: SessionCandidate[] | null) => {
      setCandidateState({
        sessionId,
        value,
      });
    },
    [sessionId],
  );
  const colleges = collegesQuery.data?.colleges ?? [];
  const eligibleDepartmentIds = session?.eligible_departments ?? [];

  const eligibleDepartmentsByCollege = useMemo<
    SessionDetailsLoadedProps["eligibleDepartmentsByCollege"]
  >(() => {
    if (eligibleDepartmentIds.length === 0) return [];

    return colleges.flatMap((college) => {
      const departments =
        college.departments?.filter((department) =>
          eligibleDepartmentIds.includes(department._id),
        ) || [];

      return departments.length > 0
        ? [
            {
              collegeId: college._id,
              collegeName: college.name,
              collegeCode: college.code,
              departments,
            },
          ]
        : [];
    });
  }, [colleges, eligibleDepartmentIds]);

  // Keep all hook-backed derivations above conditional returns.
  const sessionCandidates = session?.candidates ?? [];
  const displayedCandidates = useMemo(
    () =>
      candidateState.sessionId === sessionId && candidateState.value
        ? candidateState.value
        : sessionCandidates,
    [candidateState.sessionId, candidateState.value, sessionCandidates, sessionId],
  );
  const canManageCandidates = session?.status === "upcoming";
  const categoryCoverage = useMemo(
    () =>
      new Set(displayedCandidates.map((candidate) => candidate.position)).size,
    [displayedCandidates],
  );

  const handleCandidateSheetStateChange = useCallback(
    ({
      open,
      candidateId: nextCandidateId,
      mode,
    }: {
      open: boolean;
      candidateId: string | null;
      mode: "view" | "edit" | "create" | null;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!open || !mode) {
        params.delete("candidateId");
        params.delete("mode");
      } else {
        if (nextCandidateId) {
          params.set("candidateId", nextCandidateId);
        } else {
          params.delete("candidateId");
        }
        params.set("mode", mode);
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();

      if (nextQuery === currentQuery) return;

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const combinedError =
    sessionDetailQuery.error ||
    sessionStatsQuery.error ||
    collegesQuery.error ||
    null;
  const isLoading =
    collegesQuery.isLoading ||
    sessionDetailQuery.isLoading ||
    sessionStatsQuery.isLoading;

  if (combinedError && !session && !stats && !isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {combinedError instanceof Error
                ? combinedError.message
                : "Failed to load session"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/sessions")}
              >
                Back to Sessions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void Promise.all([
                    collegesQuery.refetch(),
                    sessionDetailQuery.refetch(),
                    sessionStatsQuery.refetch(),
                  ]);
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasHydrated || isLoading || !session || !stats) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading session details...",
          "Pulling turnout and candidate data...",
          "Preparing session workspace...",
        ]}
      />
    );
  }

  return (
    <SessionDetailsLoaded
      sessionId={sessionId}
      currentSession={session}
      sessionStats={stats}
      displayedCandidates={displayedCandidates}
      categoryCoverage={categoryCoverage}
      canManageCandidates={canManageCandidates}
      eligibleDepartmentsByCollege={eligibleDepartmentsByCollege}
      candidateId={candidateId}
      candidateMode={candidateMode}
      router={router}
      createCandidate={(payload) => createCandidateMutation.mutateAsync(payload)}
      updateCandidate={(nextCandidateId, payload) =>
        updateCandidateMutation.mutateAsync({
          candidateId: nextCandidateId,
          payload,
        })
      }
      deleteCandidate={(nextCandidateId) =>
        deleteCandidateMutation.mutateAsync(nextCandidateId)
      }
      setCandidates={setCandidates}
      handleCandidateSheetStateChange={handleCandidateSheetStateChange}
    />
  );
}

function SessionDetailsLoaded({
  sessionId,
  currentSession,
  sessionStats,
  displayedCandidates,
  categoryCoverage,
  canManageCandidates,
  eligibleDepartmentsByCollege,
  candidateId,
  candidateMode,
  router,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  setCandidates,
  handleCandidateSheetStateChange,
}: SessionDetailsLoadedProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-0 py-1">
      <div className="rounded-2xl border bg-linear-to-br from-card via-card to-muted/20 p-5 shadow-none sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={getStatusClassName(currentSession.status)}
              >
                {currentSession.status}
              </Badge>
              <Badge variant="outline">
                {currentSession.categories.length} categories
              </Badge>
              <Badge variant="outline">
                {currentSession.candidates?.length || 0} candidates
              </Badge>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {currentSession.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {currentSession.description ||
                  "No session description provided."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/sessions")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canManageCandidates ? (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/sessions/${sessionId}/edit`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Session
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Eligible Students</p>
              <p className="text-lg font-semibold">
                {sessionStats.statistics.eligible_students}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Votes</p>
              <p className="text-lg font-semibold">
                {sessionStats.statistics.total_votes}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Turnout</p>
              <p className="text-lg font-semibold">
                {sessionStats.statistics.turnout_percentage}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Rejected Votes</p>
              <p className="text-lg font-semibold">
                {sessionStats.statistics.rejected_votes}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Start
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatDateTime(currentSession.start_time)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      End
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatDateTime(currentSession.end_time)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4 md:col-span-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Geofence
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {currentSession.location.lat.toFixed(5)},{" "}
                      {currentSession.location.lng.toFixed(5)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Radius{" "}
                      {currentSession.location.radius_meters.toLocaleString()}m
                      {" • "}
                      {currentSession.is_off_campus_allowed
                        ? "Off-campus voting enabled"
                        : "Off-campus voting disabled"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4 rounded-2xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Candidate Workspace
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Smart workflow for creating, reviewing, and updating nominees.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {displayedCandidates.length} candidates
                </Badge>
                <Badge variant="outline">
                  {categoryCoverage} categories covered
                </Badge>
                <Badge variant="outline">
                  {canManageCandidates ? "Editing enabled" : "Read-only mode"}
                </Badge>
              </div>
            </div>

            <SessionCandidateManager
              title="Candidate Workspace"
              description="View and manage session candidates without leaving this page."
              candidates={displayedCandidates}
              categories={currentSession.categories}
              canManage={canManageCandidates}
              persistence="remote"
              onCandidatesChange={setCandidates}
              onCreateCandidate={(payload) => createCandidate(payload)}
              onUpdateCandidate={(candidateId, payload) =>
                updateCandidate(candidateId, payload)
              }
              onDeleteCandidate={(candidateId) => deleteCandidate(candidateId)}
              initialCandidateId={candidateId}
              initialMode={candidateMode}
              onSheetStateChange={handleCandidateSheetStateChange}
            />
          </section>
        </div>

        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Eligible Levels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(currentSession.eligible_levels || []).map((level) => (
                    <Badge key={level} variant="outline">
                      Level {level}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Categories
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentSession.categories.map((category) => (
                    <Badge key={category}>{category}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Eligible Departments
                </p>
                {eligibleDepartmentsByCollege.length > 0 ? (
                  eligibleDepartmentsByCollege.map((entry) => (
                    <div
                      key={entry?.collegeId}
                      className="rounded-xl border bg-muted/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {entry?.collegeName}
                        </p>
                        <Badge variant="outline">{entry?.collegeCode}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry?.departments.map((department) => (
                          <Badge key={department._id} variant="outline">
                            {department.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No department restrictions configured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Candidate Results Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionStats.candidates.length > 0 ? (
                sessionStats.candidates.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      {group.category}
                    </p>
                    <div className="space-y-2">
                      {group.candidates.map((candidate) => (
                        <div
                          key={`${group.category}-${candidate.name}`}
                          className="rounded-xl border bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {candidate.name}
                            </p>
                            <Badge variant="outline">
                              {candidate.vote_count} votes
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {candidate.percentage} of valid votes in this
                            category
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Results will appear here after votes are cast.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
