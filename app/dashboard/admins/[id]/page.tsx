"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Shield,
  ShieldAlert,
  User,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const {
    currentAdmin,
    isLoading,
    error,
    fetchAdminById,
    updateAdmin,
    clearError,
  } = useAdminStore();

  // Initialize form data from currentAdmin
  const initialFormData = useMemo(
    () => ({
      full_name: currentAdmin?.full_name || "",
      role: (currentAdmin?.role || "admin") as "admin" | "super_admin",
      is_active: currentAdmin?.is_active ?? true,
    }),
    [currentAdmin]
  );

  const [formData, setFormData] = useState(initialFormData);

  // Update form when initialFormData changes
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    if (adminId) {
      fetchAdminById(adminId);
    }
  }, [adminId, fetchAdminById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await updateAdmin(adminId, formData);
      router.push("/dashboard/admins");
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && !currentAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Admin not found</p>
      </div>
    );
  }

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
              Edit Administrator
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update administrator information and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Admin Info Card */}
      <Card className="max-w-2xl border shadow-none">
        <CardHeader className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-lg font-semibold text-primary ring-1 ring-primary/10">
              {currentAdmin.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {currentAdmin.full_name}
              </CardTitle>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{currentAdmin.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Joined{" "}
                    {new Date(currentAdmin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Full Name
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-10 border-muted-foreground/20 pl-10"
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "super_admin") =>
                  setFormData({ ...formData, role: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  id="role"
                  className="h-10 border-muted-foreground/20"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Standard admin privileges
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-medium">Super Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Full system access
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Status Field */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account Status
              </Label>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, is_active: !formData.is_active })
                }
                disabled={isLoading}
                className="flex w-full items-center justify-between rounded-lg border border-muted-foreground/20 px-4 py-3 transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {formData.is_active ? (
                    <ToggleRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      {formData.is_active
                        ? "Active Account"
                        : "Inactive Account"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formData.is_active
                        ? "Admin can access the system"
                        : "Admin cannot access the system"}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex h-1.5 w-1.5 rounded-full ${
                    formData.is_active
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  "Update Admin"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="h-10 flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
