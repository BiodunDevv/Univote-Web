"use client";

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminDirectoryQuery,
  useTenantAdminOverviewQuery,
  useTenantRoleCatalogQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRolesPage() {
  const { admin, hasHydrated } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";

  const globalAdminsQuery = useAdminDirectoryQuery(
    { page: 1, limit: 100 },
    { enabled: hasHydrated && isSuperAdmin },
  );
  const overviewQuery = useTenantAdminOverviewQuery({
    enabled: hasHydrated && !isSuperAdmin,
  });
  const catalogQuery = useTenantRoleCatalogQuery({
    enabled: hasHydrated && !isSuperAdmin,
  });

  const globalAdmins = globalAdminsQuery.data?.admins || [];
  const platformTotals = useMemo(
    () => ({
      total: globalAdmins.length,
      superAdmins: globalAdmins.filter((item) => item.role === "super_admin").length,
      admins: globalAdmins.filter((item) => item.role === "admin").length,
      active: globalAdmins.filter((item) => item.is_active).length,
    }),
    [globalAdmins],
  );

  const isLoading =
    !hasHydrated ||
    (isSuperAdmin
      ? globalAdminsQuery.isLoading
      : overviewQuery.isLoading || catalogQuery.isLoading);
  const errorMessage = isSuperAdmin
    ? globalAdminsQuery.error?.message
    : overviewQuery.error?.message || catalogQuery.error?.message;

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading role assignments...",
          "Pulling access definitions...",
          "Preparing permission overview...",
        ]}
      />
    );
  }

  const tenantTotals = overviewQuery.data?.totals;
  const roles = catalogQuery.data?.roles || overviewQuery.data?.roles || [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isSuperAdmin ? "Platform Role Overview" : "Role Assignments"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSuperAdmin
                ? "Review global admin authority, active access, and platform-wide role distribution."
                : "Review tenant admin role definitions, permission bundles, and current membership distribution."}
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex min-h-24 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      {isSuperAdmin ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total admins", value: platformTotals.total },
              { label: "Super admins", value: platformTotals.superAdmins },
              { label: "Admins", value: platformTotals.admins },
              { label: "Active accounts", value: platformTotals.active },
            ].map((item) => (
              <Card key={item.label} className="border shadow-none">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle>Platform roles</CardTitle>
              <CardDescription>
                Super admins control the platform globally. Regular admins remain assignable to tenant workspaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                {
                  label: "super_admin",
                  description: "Global operations, tenant lifecycle, billing oversight, and platform support.",
                },
                {
                  label: "admin",
                  description: "Reusable global admin identity that can be attached to tenant memberships.",
                },
              ].map((role) => (
                <div
                  key={role.label}
                  className="rounded-2xl border bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{role.label}</Badge>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Total", value: tenantTotals?.total_members ?? "--" },
              { label: "Active", value: tenantTotals?.active_members ?? "--" },
              { label: "Owners", value: tenantTotals?.owners ?? "--" },
              { label: "Admins", value: tenantTotals?.admins ?? "--" },
              { label: "Support", value: tenantTotals?.support ?? "--" },
              { label: "Analysts", value: tenantTotals?.analysts ?? "--" },
            ].map((item) => (
              <Card key={item.label} className="border shadow-none">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.code} className="border shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{role.label}</CardTitle>
                      <CardDescription>{role.code}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {role.permissions.length} permission
                      {role.permissions.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
