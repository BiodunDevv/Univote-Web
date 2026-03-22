"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shield, ShieldAlert, Trash2, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminDirectoryQuery,
  useDeleteGlobalAdminMutation,
  useDeleteTenantAdminUserMutation,
  useTenantAdminUsersQuery,
  type TenantAdminMember,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import {
  canAssignTenantOwnerRole,
  hasAnyTenantPermission,
} from "@/lib/tenant-permissions";

type DeleteTarget = {
  id: string;
  label: string;
} | null;

export default function AdminsPage() {
  const { admin, hasHydrated, membership } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const canManageAdmins = isSuperAdmin
    ? true
    : hasAnyTenantPermission(membership, ["admins.manage", "tenant.manage"]);
  const canManageOwners = isSuperAdmin ? true : canAssignTenantOwnerRole(membership);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const globalAdminsQuery = useAdminDirectoryQuery(
    { page: 1, limit: 100 },
    { enabled: hasHydrated && isSuperAdmin },
  );
  const tenantAdminsQuery = useTenantAdminUsersQuery(
    { page: 1, limit: 100, search },
    { enabled: hasHydrated && !isSuperAdmin },
  );

  const deleteGlobalAdmin = useDeleteGlobalAdminMutation();
  const deleteTenantAdmin = useDeleteTenantAdminUserMutation();

  const globalAdmins = globalAdminsQuery.data?.admins || [];
  const tenantAdmins = tenantAdminsQuery.data?.members || [];

  const filteredGlobalAdmins = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return globalAdmins;
    return globalAdmins.filter((member) =>
      [member.full_name, member.email, member.role].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [globalAdmins, search]);

  const isLoading = !hasHydrated || (isSuperAdmin ? globalAdminsQuery.isLoading : tenantAdminsQuery.isLoading);
  const errorMessage = isSuperAdmin
    ? globalAdminsQuery.error?.message
    : tenantAdminsQuery.error?.message;
  const totalRows = isSuperAdmin ? filteredGlobalAdmins.length : tenantAdmins.length;

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (isSuperAdmin) {
        await deleteGlobalAdmin.mutateAsync({ id: deleteTarget.id });
      } else {
        await deleteTenantAdmin.mutateAsync({ id: deleteTarget.id });
      }

      toast.success("Admin access updated");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove admin");
    }
  };

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading admin access...",
          "Checking your workspace scope...",
          "Preparing the admin directory...",
        ]}
      />
    );
  }

  if (!isSuperAdmin && !canManageAdmins) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <TenantPageHeader
          eyebrow="Tenant access"
          icon={<UserCog className="h-5 w-5" />}
          title="Admin team"
          subtitle="Your role can view operational areas assigned to you, but it cannot manage tenant administrator accounts."
        />
        <Card className="border shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Only the tenant owner or an admin with administrator-management
            access can invite, edit, or remove university administrators.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant access"
        icon={<UserCog className="h-5 w-5" />}
        title={isSuperAdmin ? "Platform Admins" : "Tenant Admin Team"}
        subtitle={
          isSuperAdmin
            ? "Manage platform-wide admin identities and super-admin access."
            : "Manage the active tenant team, scoped roles, and operational permissions."
        }
        actions={
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admins/roles">
                {isSuperAdmin ? "Role overview" : "Role assignments"}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admins/create">
                <UserPlus className="mr-2 size-4" />
                {isSuperAdmin ? "Create Admin" : "Invite Tenant Admin"}
              </Link>
            </Button>
          </div>
        }
        stats={[
          {
            label: "Visible admins",
            value: totalRows.toLocaleString(),
          },
          {
            label: "Active search",
            value: search.trim() ? "Filtered" : "All records",
          },
          {
            label: "Scope",
            value: isSuperAdmin ? "Platform" : "Tenant",
          },
          {
            label: "Role model",
            value: isSuperAdmin ? "Global" : "Scoped",
          },
        ]}
      />

      {errorMessage ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="flex min-h-32 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      <TenantSectionCard
        title={isSuperAdmin ? "Directory" : "Memberships"}
        description={
          isSuperAdmin
            ? "Platform admin accounts across the Univote control plane."
            : "Tenant-scoped admin memberships for the active institution."
        }
        action={
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or role"
            className="w-full md:max-w-sm"
          />
        }
        contentClassName="px-0 pb-0"
      >
        <div className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {!isSuperAdmin ? <TableHead>Permissions</TableHead> : null}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSuperAdmin
                ? filteredGlobalAdmins.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>
                        <div className="font-medium">{row.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.is_active ? "secondary" : "outline"}>
                          {row.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/admins/${row._id}`}>Edit</Link>
                          </Button>
                          {row._id !== admin?.id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget({
                                  id: row._id,
                                  label: row.full_name,
                                })
                              }
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : tenantAdmins.map((row: TenantAdminMember) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.role === "owner" ? (
                            <ShieldAlert className="size-4 text-amber-600" />
                          ) : (
                            <Shield className="size-4 text-primary" />
                          )}
                          <Badge variant="outline">{row.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.is_active ? "secondary" : "outline"}>
                          {row.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-[10px]">
                              {permission}
                            </Badge>
                          ))}
                          {row.permissions.length > 3 ? (
                            <Badge variant="outline" className="text-[10px]">
                              +{row.permissions.length - 3}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.role !== "owner" || canManageOwners ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/admins/${row.id}`}>Edit</Link>
                            </Button>
                          ) : null}
                          {row.admin_id !== admin?.id &&
                          (row.role !== "owner" || canManageOwners) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget({
                                  id: row.id,
                                  label: row.full_name,
                                })
                              }
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {totalRows === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 4 : 5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No admin records match the current filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </TenantSectionCard>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin access</AlertDialogTitle>
            <AlertDialogDescription>
              {isSuperAdmin
                ? `This will deactivate ${deleteTarget?.label || "this admin"} at the platform level.`
                : `This will deactivate ${deleteTarget?.label || "this membership"} for the active tenant.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
