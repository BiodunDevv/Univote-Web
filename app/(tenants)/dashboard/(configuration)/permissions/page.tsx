"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { useAdminDirectoryQuery } from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { TenantPageHeader } from "@/components/tenants/shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PermissionsPage() {
  const [search, setSearch] = useState("");
  const adminsQuery = useAdminDirectoryQuery({ page: 1, limit: 100 });

  const admins = adminsQuery.data?.admins || [];
  const filteredAdmins = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter((admin) =>
      [admin.full_name, admin.email, admin.role].some((v) => v.toLowerCase().includes(term)),
    );
  }, [admins, search]);

  if (adminsQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading role assignments…", "Preparing permission overview…"]} />;
  }

  const superAdmins = admins.filter((a) => a.role === "super_admin").length;
  const adminsOnly = admins.filter((a) => a.role === "admin").length;
  const activeAdmins = admins.filter((a) => a.is_active).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      <TenantPageHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Permissions & Roles"
        subtitle="Review who holds admin authority and how responsibility is distributed."
        stats={[
          { label: "Super admins", value: superAdmins },
          { label: "Admins", value: adminsOnly },
          { label: "Active accounts", value: activeAdmins },
          { label: "Total", value: admins.length },
        ]}
      />

      {/* Inline search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow key={admin._id}>
                <TableCell>
                  <div className="font-medium text-sm text-foreground">{admin.full_name}</div>
                  <div className="text-xs text-muted-foreground">{admin.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{admin.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={admin.is_active
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"}
                  >
                    {admin.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                  No admin records match.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
