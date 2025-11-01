"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSessionStore } from "@/lib/store/useSessionStore";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/College";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SessionsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { sessions, pagination, isLoading, fetchSessions, deleteSession } =
    useSessionStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadSessions = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    // Don't send status filter to backend - we'll filter on frontend

    fetchSessions(params).finally(() => {
      setIsInitialLoad(false);
    });
  }, [page, fetchSessions]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push("/auth/signin");
      return;
    }

    loadSessions();
  }, [token, router, loadSessions, isHydrated]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Filter sessions on the frontend
  const filteredSessions =
    statusFilter === "all"
      ? sessions
      : sessions.filter((session) => session.status === statusFilter);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteSession(id);
    } catch {
      alert("Failed to delete session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600";
      case "upcoming":
        return "bg-blue-500/10 text-blue-600";
      case "ended":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const formatLocation = (location: {
    lat?: number;
    lng?: number;
    name?: string;
    address?: string;
  }) => {
    if (location.name) return location.name;
    if (location.address) return location.address;
    if (location.lat && location.lng) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    return "Location not set";
  };

  // Show loading state immediately on initial load
  if (isInitialLoad && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Voting Sessions"
        subtitle="Create and manage voting sessions"
        actions={
          <Button
            onClick={() => router.push("/dashboard/sessions/create")}
            className="h-8 md:h-9 text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Create Session</span>
            <span className="sm:hidden">Create</span>
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        {/* Filter */}
        <Card className="p-3 border shadow-none">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">
              Status:
            </label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </Card>

        {/* Sessions Grid */}
        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading sessions...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSessions.map((session) => (
              <Card
                key={session._id}
                className="p-4 border shadow-none hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                        {session.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {session.description}
                  </p>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {new Date(session.start_time).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(session.end_time).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">
                        {formatLocation(session.location)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>{session.total_votes || 0} votes</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="pt-2.5 border-t">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {session.categories?.length || 0} categories •{" "}
                      {session.candidates?.length || 0} candidates
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {session.categories?.slice(0, 3).map((cat, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {typeof cat === "string" ? cat : cat.name}
                        </span>
                      ))}
                      {(session.categories?.length || 0) > 3 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          +{(session.categories?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}/edit`)
                      }
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleDelete(session._id, session.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSessions.length === 0 && (
          <Card className="p-8 border shadow-none">
            <div className="text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {sessions.length === 0
                  ? "No sessions found"
                  : `No ${statusFilter} sessions`}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {sessions.length === 0
                  ? "Create your first voting session to get started"
                  : `There are no sessions with status "${statusFilter}"`}
              </p>
              {sessions.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/sessions/create")}
                  className="h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Create Session
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
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
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
