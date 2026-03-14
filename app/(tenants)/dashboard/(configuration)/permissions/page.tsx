"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAdminDirectoryQuery } from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PermissionsPage() {
  const [search, setSearch] = useState("");
  const adminsQuery = useAdminDirectoryQuery({ page: 1, limit: 100 });

  const admins = adminsQuery.data?.admins || [];
  const filteredAdmins = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter((admin) =>
      [admin.full_name, admin.email, admin.role].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [admins, search]);

  if (adminsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading role assignments...",
          "Pulling administrator access levels...",
          "Preparing permission overview...",
        ]}
      />
    );
  }

  const superAdmins = admins.filter((admin) => admin.role === "super_admin").length;
  const adminsOnly = admins.filter((admin) => admin.role === "admin").length;
  const activeAdmins = admins.filter((admin) => admin.is_active).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Permissions & Roles
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review who holds super-admin authority, who is active, and how responsibility is distributed across the admin team.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Super admins", value: superAdmins },
          { label: "Admins", value: adminsOnly },
          { label: "Active accounts", value: activeAdmins },
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, email, or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="grid gap-3">
            {filteredAdmins.map((admin) => (
              <div
                key={admin._id}
                className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {admin.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{admin.role}</Badge>
                  <Badge variant="outline">
                    {admin.is_active ? "active" : "inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
