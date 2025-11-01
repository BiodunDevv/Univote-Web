"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore, getStoredToken } from "@/lib/store/useAuthStore";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/College";

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { token } = useAuthStore();
  const { currentSession, sessionStats, fetchSessionById, isLoading, error } =
    useSessionStore();
  const { colleges, fetchColleges } = useCollegeStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store to hydrate
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Check both store token and localStorage token
    const authToken = token || getStoredToken();

    if (!authToken) {
      router.push("/auth/signin");
      return;
    }

    if (sessionId) {
      fetchSessionById(sessionId);
      fetchColleges(authToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token, isHydrated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !currentSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-muted-foreground">
            {error || "Session not found"}
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/sessions")}
          >
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300";
      case "upcoming":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300";
      case "ended":
        return "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Session Details"
        subtitle="View session information and results"
        onBack={() => router.push("/dashboard/sessions")}
        badges={
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(
              currentSession.status
            )}`}
          >
            {currentSession.status.charAt(0).toUpperCase() +
              currentSession.status.slice(1)}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs inline-flex"
              onClick={() =>
                router.push(`/dashboard/sessions/${sessionId}/edit`)
              }
            >
              Edit Session
            </Button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-3">
        {/* Session Info Card */}
        <Card className="p-4 border shadow-none">
          <div className="space-y-4">
            {/* Title & Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {currentSession.title}
              </h2>
              {currentSession.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentSession.description}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Two Column Layout - Facebook Style */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Left Column - Schedule & Location */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Schedule & Location
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">
                          Start Date
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(currentSession.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">
                          End Date
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(currentSession.end_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {currentSession.location &&
                      (currentSession.location.name ||
                        currentSession.location.address) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">
                              Location
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {currentSession.location.name ||
                                currentSession.location.address}
                            </p>
                            {currentSession.location.radius_meters && (
                              <p className="text-xs text-muted-foreground">
                                Radius: {currentSession.location.radius_meters}m
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Off-Campus Voting */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Off-Campus Voting
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currentSession.is_off_campus_allowed
                          ? "Allowed"
                          : "Not Allowed"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {currentSession.categories &&
                  currentSession.categories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Voting Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentSession.categories.map((category) => {
                          const cat =
                            typeof category === "string"
                              ? category
                              : category.name;
                          return (
                            <span
                              key={cat}
                              className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                            >
                              {cat}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Eligible Levels */}
                {currentSession.eligible_levels &&
                  currentSession.eligible_levels.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Eligible Levels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentSession.eligible_levels.map((level) => (
                          <span
                            key={level}
                            className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
                          >
                            Level {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Right Column - Eligible Departments by College */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Eligible Departments
                </h3>
                {currentSession.eligible_departments &&
                currentSession.eligible_departments.length > 0 ? (
                  <div className="space-y-3">
                    {colleges.map((college) => {
                      // Get departments for this college that are in eligible list
                      const collegeDepts =
                        college.departments
                          ?.filter((dept) =>
                            currentSession.eligible_departments?.includes(
                              dept._id
                            )
                          )
                          .map((dept) => dept.name) || [];

                      // Only show college if it has eligible departments
                      if (collegeDepts.length === 0) return null;

                      return (
                        <div key={college._id} className="space-y-2">
                          {/* College Header */}
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-lg">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                              {college.code}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-300">
                              {college.name}
                            </span>
                            <span className="ml-auto text-xs text-blue-600 dark:text-blue-300 font-medium">
                              {collegeDepts.length}
                            </span>
                          </div>
                          {/* Departments */}
                          <div className="pl-3 space-y-1">
                            {collegeDepts.map((deptName) => (
                              <div
                                key={deptName}
                                className="flex items-center gap-2 py-1"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-foreground">
                                  {deptName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No departments specified
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        {sessionStats && (
          <Card className="p-4 border shadow-none">
            <h3 className="text-sm font-semibold mb-3">Voting Statistics</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-[10px] font-medium text-blue-900 dark:text-blue-300">
                    Eligible Students
                  </p>
                </div>
                <p className="mt-1.5 text-xl font-semibold text-blue-900 dark:text-blue-100">
                  {sessionStats.statistics.eligible_students.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <p className="text-[10px] font-medium text-green-900 dark:text-green-300">
                    Total Votes
                  </p>
                </div>
                <p className="mt-1.5 text-xl font-semibold text-green-900 dark:text-green-100">
                  {sessionStats.statistics.total_votes.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border bg-purple-50 dark:bg-purple-950/20 p-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <p className="text-[10px] font-medium text-purple-900 dark:text-purple-300">
                    Turnout
                  </p>
                </div>
                <p className="mt-1.5 text-xl font-semibold text-purple-900 dark:text-purple-100">
                  {sessionStats.statistics.turnout_percentage}
                </p>
              </div>
              <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/20 p-3">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <p className="text-[10px] font-medium text-orange-900 dark:text-orange-300">
                    Duplicate Attempts
                  </p>
                </div>
                <p className="mt-1.5 text-xl font-semibold text-orange-900 dark:text-orange-100">
                  {sessionStats.statistics.duplicate_attempts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <p className="text-[10px] font-medium text-red-900 dark:text-red-300">
                    Rejected Votes
                  </p>
                </div>
                <p className="mt-1.5 text-xl font-semibold text-red-900 dark:text-red-100">
                  {sessionStats.statistics.rejected_votes.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Results by Position */}
        {sessionStats && sessionStats.candidates.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold px-1">Results by Position</h3>
            {sessionStats.candidates.map((categoryData) => (
              <Card
                key={categoryData.category}
                className="p-4 border shadow-none"
              >
                <h4 className="text-sm font-semibold mb-4">
                  {categoryData.category}
                </h4>
                {/* Grid Layout for Candidates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryData.candidates
                    .sort((a, b) => b.vote_count - a.vote_count)
                    .map((candidate, index) => (
                      <div
                        key={candidate.name}
                        className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all"
                      >
                        {/* Rank Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                          {index + 1}
                        </div>

                        {/* Candidate Photo */}
                        {candidate.photo_url ? (
                          <div className="relative w-full aspect-square bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-muted/50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-3xl font-bold text-muted-foreground">
                                  {candidate.name.charAt(0)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                No photo
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Candidate Info */}
                        <div className="p-3 space-y-2">
                          <div className="space-y-1">
                            <h5 className="text-sm font-semibold text-foreground line-clamp-1">
                              {candidate.name}
                            </h5>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium text-foreground">
                                {candidate.vote_count.toLocaleString()} votes
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {candidate.percentage}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: candidate.percentage }}
                            />
                          </div>

                          {/* Bio and Manifesto */}
                          {(() => {
                            const fullCandidate =
                              currentSession.candidates?.find(
                                (c) =>
                                  c.name === candidate.name &&
                                  c.position === categoryData.category
                              );

                            return (
                              (fullCandidate?.bio ||
                                fullCandidate?.manifesto) && (
                                <div className="space-y-2 pt-2 border-t">
                                  {fullCandidate.bio && (
                                    <div>
                                      <h6 className="text-xs font-semibold text-foreground mb-1">
                                        Biography
                                      </h6>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {fullCandidate.bio}
                                      </p>
                                    </div>
                                  )}
                                  {fullCandidate.manifesto && (
                                    <div>
                                      <h6 className="text-xs font-semibold text-foreground mb-1">
                                        Manifesto
                                      </h6>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {fullCandidate.manifesto}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            );
                          })()}

                          {/* Edit Button */}
                          {currentSession.status !== "ended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Find the candidate ID from the full candidates list
                                const fullCandidate =
                                  currentSession.candidates?.find(
                                    (c) =>
                                      c.name === candidate.name &&
                                      c.position === categoryData.category
                                  );
                                if (fullCandidate) {
                                  router.push(
                                    `/dashboard/sessions/${params.id}/candidates/${fullCandidate._id}/edit`
                                  );
                                }
                              }}
                              className="w-full h-8 text-xs mt-2"
                            >
                              Edit Candidate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          currentSession.candidates &&
          currentSession.candidates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold px-1">Candidates</h3>
              <Card className="p-4 border shadow-none">
                {/* Grid Layout for Candidates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSession.candidates.map((candidate, index) => (
                    <div
                      key={candidate._id}
                      className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all"
                    >
                      {/* Number Badge */}
                      <div className="absolute top-3 left-3 z-10 bg-muted text-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>

                      {/* Candidate Photo */}
                      {candidate.photo_url ? (
                        <div className="relative w-full aspect-square bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-muted/50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-3xl font-bold text-muted-foreground">
                                {candidate.name.charAt(0)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              No photo
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Candidate Info */}
                      <div className="p-3 space-y-2">
                        <h5 className="text-sm font-semibold text-foreground line-clamp-1">
                          {candidate.name}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {candidate.position}
                        </p>

                        {/* Bio and Manifesto */}
                        {(candidate.bio || candidate.manifesto) && (
                          <div className="space-y-2 pt-2 border-t">
                            {candidate.bio && (
                              <div>
                                <h6 className="text-xs font-semibold text-foreground mb-1">
                                  Biography
                                </h6>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {candidate.bio}
                                </p>
                              </div>
                            )}
                            {candidate.manifesto && (
                              <div>
                                <h6 className="text-xs font-semibold text-foreground mb-1">
                                  Manifesto
                                </h6>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {candidate.manifesto}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {currentSession.status !== "ended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/dashboard/sessions/${params.id}/candidates/${candidate._id}/edit`
                              )
                            }
                            className="w-full h-8 text-xs mt-2"
                          >
                            Edit Candidate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  );
}
