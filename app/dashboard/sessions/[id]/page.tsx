"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Candidate {
  _id: string;
  name: string;
  photo_url?: string;
  bio?: string;
  manifesto?: string;
  vote_count: number;
  position: string;
}

interface Session {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  categories: string[];
  location?: string;
  is_off_campus_allowed: boolean;
  eligible_college?: string;
  eligible_departments?: string[];
  eligible_levels?: string[];
  candidates: Candidate[];
}

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { token } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }

        const data = await response.json();
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, token, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-muted-foreground">
            {error || "Session not found"}
          </p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Group candidates by position
  const candidatesByPosition = session.candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  // Calculate total votes
  const totalVotes = session.candidates.reduce(
    (sum, candidate) => sum + candidate.vote_count,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-700 ring-green-500/20 dark:text-green-400";
      case "upcoming":
        return "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-400";
      case "completed":
        return "bg-gray-500/10 text-gray-700 ring-gray-500/20 dark:text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-700 ring-gray-500/20 dark:text-gray-400";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-10">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Session Details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View session information and results
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
            session.status
          )}`}
        >
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>

      {/* Session Info Card */}
      <Card className="border shadow-none">
        <CardHeader className="border-b px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                {session.title}
              </CardTitle>
              {session.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {session.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.end_time).toLocaleString()}
                  </p>
                </div>
              </div>
              {session.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {session.location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Eligibility */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Off-Campus Voting</p>
                  <p className="text-sm text-muted-foreground">
                    {session.is_off_campus_allowed ? "Allowed" : "Not Allowed"}
                  </p>
                </div>
              </div>
              {session.eligible_college && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Eligible College</p>
                    <p className="text-sm text-muted-foreground">
                      {session.eligible_college}
                    </p>
                  </div>
                </div>
              )}
              {session.eligible_departments &&
                session.eligible_departments.length > 0 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Eligible Departments
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.eligible_departments.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              {session.eligible_levels &&
                session.eligible_levels.length > 0 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Eligible Levels</p>
                      <p className="text-sm text-muted-foreground">
                        {session.eligible_levels.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="border shadow-none">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-base font-semibold">
            Voting Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Candidates</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {session.candidates.length}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Positions</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {Object.keys(candidatesByPosition).length}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Votes</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">{totalVotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results by Position */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Results by Position</h2>
        {Object.entries(candidatesByPosition).map(([position, candidates]) => {
          const positionTotal = candidates.reduce(
            (sum, c) => sum + c.vote_count,
            0
          );

          return (
            <Card key={position} className="border shadow-none">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-base font-semibold">
                  {position}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <div className="space-y-4">
                  {candidates.map((candidate) => {
                    const percentage =
                      positionTotal > 0
                        ? (
                            (candidate.vote_count / positionTotal) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <div key={candidate._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              {candidate.bio && (
                                <p className="text-xs text-muted-foreground">
                                  {candidate.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {candidate.vote_count} votes
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {percentage}%
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
