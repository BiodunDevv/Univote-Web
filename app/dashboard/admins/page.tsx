"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore } from "@/lib/store/useAdminStore";
import {
  Plus,
  X,
  Shield,
  ShieldAlert,
  Trash2,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminsPage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  const { admins, pagination, isLoading, fetchAdmins, deleteAdmin } =
    useAdminStore();

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (id: string, email: string) => {
    // Prevent deleting yourself
    if (admin?.id === id) {
      alert("Cannot delete your own account");
      return;
    }

    setSelectedAdmin({ id, email });
    setDeleteConfirmText("");
    setIsPermanentDelete(false);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    // Check if permanent delete is requested
    if (isPermanentDelete && deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm permanent deletion');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdmin(selectedAdmin.id, isPermanentDelete);
      setDeleteModalOpen(false);
      setSelectedAdmin(null);
      setDeleteConfirmText("");
      setIsPermanentDelete(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || "Failed to delete admin");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !admins.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-9xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Administrators
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Manage admin users and permissions
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/admins/create")}
              className="h-8 md:h-9 text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Create Admin</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        {/* Filters */}
        <Card className="p-3 border shadow-none">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-muted-foreground">
              Role:
            </label>
            <Select
              value={roleFilter}
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 w-40 text-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm font-medium text-muted-foreground">
              Status:
            </label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 w-40 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </Card>

        {/* Admins Grid */}
        {isLoading && admins.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading admins...</p>
            </div>
          </div>
        ) : admins.length === 0 ? (
          <Card className="p-8 border shadow-none">
            <div className="text-center">
              <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                No admins found
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Create your first admin to get started"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => router.push("/dashboard/admins/create")}
                  className="h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Create Admin
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {admins.map((adminItem) => (
              <Card
                key={adminItem._id}
                className="p-4 border shadow-none hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header with Avatar and Role Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {adminItem.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {adminItem.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {adminItem.email}
                        </p>
                      </div>
                    </div>
                    {adminItem.role === "super_admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400 shrink-0">
                        <ShieldAlert className="h-3 w-3" />
                        Super
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 shrink-0">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            adminItem.is_active ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            adminItem.is_active
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {adminItem.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Login</span>
                      <span className="text-foreground">
                        {adminItem.last_login_at
                          ? new Date(
                              adminItem.last_login_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() =>
                        router.push(`/dashboard/admins/${adminItem._id}`)
                      }
                    >
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() =>
                        handleDeleteClick(adminItem._id, adminItem.email)
                      }
                      disabled={admin?.id === adminItem._id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Administrator</AlertDialogTitle>
          </AlertDialogHeader>

          {/* Modal Content - Fixed hydration error by removing AlertDialogDescription wrapper */}
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You are about to delete{" "}
              <span className="font-semibold text-foreground">
                {selectedAdmin?.email}
              </span>
              .
            </p>

            {/* Permanent Delete Option */}
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="permanent-delete"
                  checked={isPermanentDelete}
                  onChange={(e) => {
                    setIsPermanentDelete(e.target.checked);
                    setDeleteConfirmText("");
                  }}
                  className="mt-1 h-4 w-4 rounded border-destructive/30 text-destructive focus:ring-destructive"
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="permanent-delete"
                    className="text-sm font-medium text-destructive cursor-pointer"
                  >
                    Permanently delete this admin
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isPermanentDelete
                      ? "This will permanently delete the admin from the database. This action cannot be undone."
                      : "Uncheck to deactivate instead of permanently deleting."}
                  </p>
                </div>
              </div>

              {/* Confirmation Input for Permanent Delete */}
              {isPermanentDelete && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-text" className="text-xs font-medium">
                    Type{" "}
                    <span className="font-bold text-destructive">DELETE</span>{" "}
                    to confirm
                  </Label>
                  <Input
                    id="confirm-text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="h-9 border-destructive/30 focus-visible:ring-destructive"
                  />
                </div>
              )}
            </div>

            {!isPermanentDelete && (
              <p className="text-xs text-muted-foreground">
                The admin will be deactivated and won&apos;t be able to log in,
                but their data will be preserved.
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                isDeleting ||
                (isPermanentDelete && deleteConfirmText !== "DELETE")
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : isPermanentDelete ? (
                "Permanently Delete"
              ) : (
                "Deactivate Admin"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
