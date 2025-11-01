"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  Loader2,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Admin not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-9xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/admins")}
              className="h-8 w-8 rounded-full shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Edit Administrator
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Update administrator information and permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Admin Info Card */}
        <Card className="p-4 border shadow-none">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
              {currentAdmin.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {currentAdmin.full_name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{currentAdmin.email}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-4">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-medium">
                Full Name
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
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
                  className="h-9 text-sm pl-9"
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-medium">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "super_admin") =>
                  setFormData({ ...formData, role: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="role" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm">Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-sm">Super Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Status Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Account Status</Label>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, is_active: !formData.is_active })
                }
                disabled={isLoading}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      formData.is_active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div className="text-xs font-medium">
                      {formData.is_active ? "Active" : "Inactive"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formData.is_active
                        ? "Can access system"
                        : "Cannot access system"}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isLoading} className="h-9 flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Admin"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/admins")}
                disabled={isLoading}
                className="h-9 flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
