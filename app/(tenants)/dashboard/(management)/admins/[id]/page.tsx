"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useGlobalAdminDetailQuery,
  useTenantAdminUserQuery,
  useTenantRoleCatalogQuery,
  useUpdateGlobalAdminMutation,
  useUpdateTenantAdminUserMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function EditAdminPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { admin, hasHydrated, membership } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const canManageAdmins = isSuperAdmin
    ? true
    : hasAnyTenantPermission(membership, ["admins.manage", "tenant.manage"]);
  const canAssignOwner = canAssignTenantOwnerRole(membership);
  const id = params.id;

  const globalAdminQuery = useGlobalAdminDetailQuery(id, {
    enabled: hasHydrated && isSuperAdmin,
  });
  const tenantAdminQuery = useTenantAdminUserQuery(id, {
    enabled: hasHydrated && !isSuperAdmin,
  });
  const roleCatalogQuery = useTenantRoleCatalogQuery({
    enabled: hasHydrated && !isSuperAdmin,
  });
  const updateGlobalAdmin = useUpdateGlobalAdminMutation(id);
  const updateTenantAdmin = useUpdateTenantAdminUserMutation(id);

  const [formData, setFormData] = useState<{
    full_name: string;
    role: AdminRole;
    is_active: boolean;
    permissions: string[];
  }>({
    full_name: "",
    role: "admin",
    is_active: true,
    permissions: [],
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (isSuperAdmin && globalAdminQuery.data?.admin) {
      const current = globalAdminQuery.data.admin;
      setFormData({
        full_name: current.full_name,
        role: current.role,
        is_active: current.is_active,
        permissions: [],
      });
      return;
    }

    if (!isSuperAdmin && tenantAdminQuery.data?.member) {
      const current = tenantAdminQuery.data.member;
      setFormData({
        full_name: current.full_name,
        role: current.role,
        is_active: current.is_active,
        permissions: current.permissions,
      });
    }
  }, [
    globalAdminQuery.data?.admin,
    hasHydrated,
    isSuperAdmin,
    tenantAdminQuery.data?.member,
  ]);

  const visibleRoleCatalog = useMemo(
    () =>
      (roleCatalogQuery.data?.roles || []).filter(
        (role) =>
          canAssignOwner || role.code !== "owner" || formData.role === "owner",
      ),
    [canAssignOwner, formData.role, roleCatalogQuery.data?.roles],
  );
  const selectedRole = useMemo(
    () =>
      !isSuperAdmin
        ? visibleRoleCatalog.find((role) => role.code === formData.role) || null
        : null,
    [formData.role, isSuperAdmin, visibleRoleCatalog],
  );

  const isLoading =
    !hasHydrated ||
    (isSuperAdmin
      ? globalAdminQuery.isLoading
      : tenantAdminQuery.isLoading || roleCatalogQuery.isLoading);
  const errorMessage = isSuperAdmin
    ? globalAdminQuery.error?.message
    : tenantAdminQuery.error?.message || roleCatalogQuery.error?.message;

  const email = isSuperAdmin
    ? globalAdminQuery.data?.admin.email
    : tenantAdminQuery.data?.member.email;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (isSuperAdmin) {
        await updateGlobalAdmin.mutateAsync({
          full_name: formData.full_name,
          role: formData.role as "admin" | "super_admin",
          is_active: formData.is_active,
        });
      } else {
        await updateTenantAdmin.mutateAsync({
          full_name: formData.full_name,
          role: formData.role as TenantRole,
          is_active: formData.is_active,
          permissions: formData.permissions,
        });
      }

      toast.success("Admin updated successfully");
      router.push("/dashboard/admins");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update admin");
    }
  };

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading admin profile...",
          "Pulling access details...",
          "Preparing the edit surface...",
        ]}
      />
    );
  }

  if (!isSuperAdmin && !canManageAdmins) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Edit Admin</h1>
          <p className="text-sm text-muted-foreground">
            Your tenant role does not allow administrator management.
          </p>
        </section>

        <Card className="border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Only the tenant owner or an admin with administrator-management
            access can edit university administrator accounts.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin && formData.role === "owner" && !canAssignOwner) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Edit Admin</h1>
          <p className="text-sm text-muted-foreground">
            Owner accounts can only be edited by the current tenant owner.
          </p>
        </section>

        <Card className="border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            This membership is assigned to the university owner role. Sign in as
            the tenant owner to update or deactivate this account.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Edit Admin</h1>
          <p className="text-sm text-muted-foreground">
            The requested admin record could not be loaded.
          </p>
        </section>

        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 text-sm text-muted-foreground">
            <p>{errorMessage || "The admin membership may have been removed or is no longer accessible."}</p>
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Edit Admin</h1>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Update platform admin identity and activation status."
            : "Update tenant-scoped role and membership state. Permissions follow the selected role automatically."}
        </p>
      </section>

      {errorMessage ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex min-h-24 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle>Admin profile</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      role: value as AdminRole,
                      permissions: !isSuperAdmin
                        ? visibleRoleCatalog.find((role) => role.code === value)
                            ?.permissions || current.permissions
                        : current.permissions,
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

            <div className="space-y-2">
              <Label>Status</Label>
              <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((current) => ({
                      ...current,
                      is_active: Boolean(checked),
                    }))
                  }
                />
                <span>Active access</span>
              </label>
            </div>

            {!isSuperAdmin ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium">Permissions</h2>
                  <p className="text-sm text-muted-foreground">
                    The access bundle below is fixed by the selected university
                    role.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(selectedRole?.permissions || formData.permissions).map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                    >
                      <Checkbox checked disabled />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateGlobalAdmin.isPending || updateTenantAdmin.isPending}
              >
                Save changes
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
