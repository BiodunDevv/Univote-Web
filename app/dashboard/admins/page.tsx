"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { Plus, X, Shield, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminsPage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  const { admins, pagination, isLoading, fetchAdmins, deleteAdmin } =
    useAdminStore();

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadAdmins = useCallback(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      limit: 20,
    };
    if (roleFilter !== "all") params.role = roleFilter;
    if (statusFilter !== "all") params.is_active = statusFilter === "active";

    fetchAdmins(params);
  }, [page, roleFilter, statusFilter, fetchAdmins]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push("/auth/signin");
      return;
    }

    if (admin?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    loadAdmins();
  }, [token, admin?.role, router, loadAdmins, isHydrated]);

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all";

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) return;

    try {
      await deleteAdmin(id, false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || "Failed to deactivate admin");
    }
  };

  if (isLoading && !admins.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-10">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Administrators
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination.total} total admins
            {admins.length > 0 && (
              <span> · Showing {admins.length} on this page</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push("/dashboard/admins/create")}
          className="h-9"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      {/* Admins Table with Integrated Filters */}
      <Card className="border shadow-none">
        {/* Table Header with Filters */}
        <CardHeader className="border-b px-6 py-5">
          <div className="space-y-5">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <CardTitle className="text-base font-semibold">
                  All Administrators
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {pagination.total} total
                </span>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex gap-3">
              {/* Role Filter */}
              <div className="w-48">
                <Select value={roleFilter} onValueChange={handleRoleChange}>
                  <SelectTrigger className="h-9 border-muted-foreground/20">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-48">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-9 border-muted-foreground/20">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Active filters:
                </span>
                {roleFilter !== "all" && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
                    <Shield className="h-3 w-3" />
                    <span>
                      Role:{" "}
                      {roleFilter === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                    <button
                      onClick={() => handleRoleChange("all")}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {statusFilter !== "all" && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                    <span>
                      Status:{" "}
                      {statusFilter === "active" ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => handleStatusChange("all")}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {admins.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShieldAlert className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">No admins found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Click the button above to create your first admin"}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="sticky top-0 z-10 grid grid-cols-[50px_1fr_1.5fr_140px_120px_140px_140px] gap-4 border-b bg-muted/50 px-6 py-3 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <div>#</div>
                <div>NAME</div>
                <div>EMAIL</div>
                <div>ROLE</div>
                <div>STATUS</div>
                <div>LAST LOGIN</div>
                <div>ACTIONS</div>
              </div>

              {/* Table Body - Scrollable */}
              <div className="max-h-[calc(100vh-400px)] min-h-[400px] overflow-y-auto">
                {admins.map((adminItem, index) => (
                  <div
                    key={adminItem._id}
                    className="group grid grid-cols-[50px_1fr_1.5fr_140px_120px_140px_140px] gap-4 border-b px-6 py-4 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    {/* Row Number */}
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {(page - 1) * 20 + index + 1}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
                        {adminItem.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-medium">
                        {adminItem.full_name}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center">
                      <span className="truncate text-sm text-muted-foreground">
                        {adminItem.email}
                      </span>
                    </div>

                    {/* Role */}
                    <div className="flex items-center">
                      {adminItem.role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-500/20 dark:text-purple-400">
                          <ShieldAlert className="h-3 w-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            adminItem.is_active
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            adminItem.is_active
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {adminItem.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">
                        {adminItem.last_login_at
                          ? new Date(
                              adminItem.last_login_at
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/admins/${adminItem._id}`)
                        }
                        className="h-8 px-3 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(adminItem._id, adminItem.email)
                        }
                        className="h-8 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(page - 1) * 20 + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-foreground">
                      {(page - 1) * 20 + admins.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {pagination.total}
                    </span>{" "}
                    admins
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="h-8"
                    >
                      First
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.pages ||
                            Math.abs(p - page) <= 1
                        )
                        .map((p, idx, arr) => {
                          const showEllipsis =
                            idx > 0 && arr[idx - 1] !== p - 1;
                          return (
                            <div key={p} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={page === p ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="h-8 min-w-10"
                              >
                                {p}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                      className="h-8"
                    >
                      Next
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(pagination.pages)}
                      disabled={page === pagination.pages}
                      className="h-8"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
