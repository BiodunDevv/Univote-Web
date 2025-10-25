"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
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

export default function SessionsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { sessions, pagination, isLoading, fetchSessions, deleteSession } =
    useSessionStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadSessions = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (statusFilter !== "all") params.status = statusFilter;

    fetchSessions(params);
  }, [page, statusFilter, fetchSessions]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push("/auth/signin");
      return;
    }

    loadSessions();
  }, [token, router, loadSessions, isHydrated]);

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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !sessions.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Voting Sessions</h2>
          <p className="text-muted-foreground">
            Create and manage voting sessions
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/sessions/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Filter sessions by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">
                    {session.title}
                  </CardTitle>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                      session.status
                    )}`}
                  >
                    {session.status.charAt(0).toUpperCase() +
                      session.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {session.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(session.start_time).toLocaleDateString()} -{" "}
                    {new Date(session.end_time).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{session.location.name}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{session.total_votes} votes</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {session.categories.length} categories
                </p>
                <div className="flex flex-wrap gap-1">
                  {session.categories.slice(0, 3).map((cat, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-muted px-2 py-1 text-xs"
                    >
                      {cat.name}
                    </span>
                  ))}
                  {session.categories.length > 3 && (
                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      +{session.categories.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/dashboard/sessions/${session._id}`)
                  }
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/dashboard/sessions/${session._id}/edit`)
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(session._id, session.title)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No sessions found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first voting session to get started
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/sessions/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
