"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Lock,
} from "lucide-react";

export default function CreateAdminPage() {
  const router = useRouter();
  const { createAdmin, isLoading, error, clearError } = useAdminStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "admin" as "admin" | "super_admin",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await createAdmin(formData);
      router.push("/dashboard/admins");
    } catch {
      // Error handled by store
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
              Create New Admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a new administrator to the system
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

      {/* Form Card */}
      <Card className="max-w-2xl border shadow-none">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-base font-semibold">
            Admin Information
          </CardTitle>
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

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Email Address
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-10 border-muted-foreground/20 pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  minLength={8}
                  required
                  disabled={isLoading}
                  className="h-10 border-muted-foreground/20 pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
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
                    Creating...
                  </>
                ) : (
                  "Create Admin"
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
