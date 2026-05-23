"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useCreateGlobalAdminMutation,
  useCreateTenantAdminUserMutation,
  useTenantRoleCatalogQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  canAssignTenantOwnerRole,
  hasAnyTenantPermission,
} from "@/lib/tenant-permissions";

type TenantRole = "owner" | "admin" | "support" | "analyst";
type AdminRole = "admin" | "super_admin" | TenantRole;

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "tenant.manage": "Full tenant administration access.",
  "tenant.settings.manage": "Manage tenant settings and operational defaults.",
  "tenant.identity.manage":
    "Configure identifiers and sign-in identity policy.",
  "tenant.labels.manage": "Customize participant labels and terminology.",
  "tenant.auth-policy.manage": "Control authentication and account policy.",
  "tenant.roles.manage": "Manage tenant admin roles and permission templates.",
  "students.manage": "Create, update, and deactivate participant records.",
  "participants.manage": "Manage participant records in unified views.",
  "participants.view": "Read-only participant access.",
  "sessions.manage": "Create and manage elections and ballots.",
  "support.manage": "Access and manage support desk tickets.",
  "analytics.view": "View analytics and monitoring dashboards.",
  "admins.manage": "Invite and manage tenant administrators.",
  "reports.export": "Export reports and compliance data.",
};

function toPermissionLabel(permission: string) {
  return permission
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function fetchOnboardingDetails() {
  const response = await fetch("/api/admin/admin-users/onboarding", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch onboarding details");
  }

  const data = await response.json();
  return data.onboarding || {};
}

export default function CreateAdminPage() {
  const router = useRouter();
  const { admin, hasHydrated, membership } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const canManageAdmins = isSuperAdmin
    ? true
    : hasAnyTenantPermission(membership, ["admins.manage", "tenant.manage"]);
  const canAssignOwner = canAssignTenantOwnerRole(membership);

  const roleCatalogQuery = useTenantRoleCatalogQuery({
    enabled: hasHydrated && !isSuperAdmin,
  });

  const onboardingQuery = useQuery({
    queryKey: ["admin:onboarding"],
    queryFn: fetchOnboardingDetails,
    enabled: hasHydrated && !isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const createGlobalAdmin = useCreateGlobalAdminMutation();
  const createTenantAdmin = useCreateTenantAdminUserMutation();

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    password: string;
    role: AdminRole;
    permissions: string[];
  }>({
    full_name: "",
    email: "",
    password: "123456789",
    role: "admin",
    permissions: [],
  });

  useEffect(() => {
    if (!hasHydrated || isSuperAdmin) return;

    const selectedRole = roleCatalogQuery.data?.roles.find(
      (role) => role.code === formData.role,
    );

    if (selectedRole && formData.permissions.length === 0) {
      setFormData((current) => ({
        ...current,
        permissions: selectedRole.permissions,
      }));
    }
  }, [
    formData.permissions.length,
    formData.role,
    hasHydrated,
    isSuperAdmin,
    roleCatalogQuery.data?.roles,
  ]);

  const availablePermissions = useMemo(() => {
    if (isSuperAdmin) return [];

    return Array.from(
      new Set(
        (roleCatalogQuery.data?.roles || []).flatMap(
          (role) => role.permissions,
        ),
      ),
    );
  }, [isSuperAdmin, roleCatalogQuery.data?.roles]);

  const handleAutoFillFromOnboarding = () => {
    if (!onboardingQuery.data) {
      toast.error("No onboarding details available");
      return;
    }

    setFormData((current) => ({
      ...current,
      full_name: onboardingQuery.data.contact_name || current.full_name,
      email: onboardingQuery.data.contact_email || current.email,
    }));

    toast.success("Filled with application contact details");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (isSuperAdmin) {
        await createGlobalAdmin.mutateAsync({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role as "admin" | "super_admin",
        });
      } else {
        await createTenantAdmin.mutateAsync({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role as TenantRole,
          permissions: formData.permissions,
        });
      }

      toast.success("Admin created successfully");
      router.push("/dashboard/admins");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create admin",
      );
    }
  };

  if (!hasHydrated || (!isSuperAdmin && roleCatalogQuery.isLoading)) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading admin creation form...",
          "Checking available roles...",
          "Preparing access controls...",
        ]}
      />
    );
  }

  if (!isSuperAdmin && !canManageAdmins) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Access restricted
          </h1>
          <p className="text-sm text-muted-foreground">
            Your tenant role does not allow admin user management.
          </p>
        </section>

        <Card className="border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Only university owners and admins with admin-management access can
            invite or update tenant administrators.
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleCatalog = roleCatalogQuery.data?.roles || [];
  const visibleRoleCatalog = isSuperAdmin
    ? []
    : roleCatalog.filter((role) => canAssignOwner || role.code !== "owner");
  const selectedRole = isSuperAdmin
    ? null
    : visibleRoleCatalog.find((role) => role.code === formData.role) ||
      visibleRoleCatalog[0] ||
      null;

  if (!isSuperAdmin && roleCatalog.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Invite Tenant Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            The tenant role catalog is unavailable right now, so admin creation
            is temporarily blocked.
          </p>
        </section>

        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 text-sm text-muted-foreground">
            <p>
              {roleCatalogQuery.error?.message ||
                "No tenant roles were returned by the API."}
            </p>
            <div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/admins">Back to admins</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-x-hidden">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {isSuperAdmin ? "Create Platform Admin" : "Invite Tenant Admin"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Create a new global administrator or super-admin identity. New platform-admin passwords are set automatically to 123456789."
            : "Create a tenant-scoped admin membership and assign the right permissions. New tenant-admin passwords are set automatically to 123456789."}
        </p>
      </section>

      {roleCatalogQuery.error && !isSuperAdmin ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex min-h-24 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {roleCatalogQuery.error.message}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle>Admin details</CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? "Platform admins exist outside tenant boundaries."
              : "Tenant admin users are bound to the active tenant only."}
          </CardDescription>
        </CardHeader>

        {!isSuperAdmin && onboardingQuery.data?.contact_name ? (
          <div className="border-b px-6 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoFillFromOnboarding}
              disabled={onboardingQuery.isLoading}
            >
              Use application contact details
            </Button>
          </div>
        ) : null}

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  disabled
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  This account will sign in with 123456789 and should change it
                  after first login.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      role: value as AdminRole,
                      permissions: [],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin ? (
                      <>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </>
                    ) : (
                      visibleRoleCatalog.map((role) => (
                        <SelectItem key={role.code} value={role.code}>
                          {role.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isSuperAdmin ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium">Permissions</h2>
                  <p className="text-sm text-muted-foreground">
                    Each university role has a fixed permission bundle. Review
                    the access below before creating the account.
                  </p>
                </div>
                <div className="grid gap-3">
                  {(selectedRole?.permissions || availablePermissions).map(
                    (permission) => (
                    <label
                      key={permission}
                      className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                    >
                      <Checkbox
                        checked
                        disabled
                      />
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          {toPermissionLabel(permission)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {PERMISSION_DESCRIPTIONS[permission] ||
                            "Tenant permission for this admin role."}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {permission}
                        </span>
                      </span>
                    </label>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={
                  createGlobalAdmin.isPending || createTenantAdmin.isPending
                }
              >
                Create admin
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/admins">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
