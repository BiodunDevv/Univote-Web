"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Search } from "lucide-react";
import { usePlatformTenantsQuery } from "@/lib/queries/platform";
import { TenantPageHeader } from "@/components/tenants/shared/page-header";
import { CreateTenantDialog } from "@/components/tenants/create-tenant-dialog";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PlatformTenantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading, error } = usePlatformTenantsQuery({
    search,
    status: status === "all" ? undefined : status,
    limit: 50,
  });

  const tenants = data?.tenants || [];

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading tenant directory...",
          "Loading application posture...",
          "Preparing platform controls...",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <TenantPageHeader
        eyebrow="Platform console"
        icon={<Building2 className="h-4 w-4" />}
        title="Tenants"
        subtitle="Review institution provisioning, domains, and activation state across the platform."
        actions={<CreateTenantDialog />}
        stats={
          data
            ? [
                { label: "Total", value: data.total },
                { label: "Showing", value: tenants.length },
              ]
            : undefined
        }
      />

      {error ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {error.message}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-none">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Tenant Directory</CardTitle>
          <div className="grid w-full gap-3 md:max-w-3xl md:grid-cols-[1fr_180px]">
            <div>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Search className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, slug, or domain"
                />
              </InputGroup>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tenant status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tenant.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.primary_domain || "Subdomain only"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tenant.status === "active" ? "active" : "suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/super-admin/tenants/${tenant.id}`}>
                        Open
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && tenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No tenants match the current filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
