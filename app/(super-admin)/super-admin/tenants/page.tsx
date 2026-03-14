"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { usePlatformTenantsQuery } from "@/lib/queries/platform";
import { CreateTenantDialog } from "@/components/tenants/create-tenant-dialog";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("all");

  const { data, isLoading, error } = usePlatformTenantsQuery({
    search,
    status: status === "all" ? undefined : status,
    subscription_status: subscriptionStatus === "all" ? undefined : subscriptionStatus,
    limit: 50,
  });

  const tenants = data?.tenants || [];

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading tenant directory...",
          "Pulling subscription posture...",
          "Preparing platform controls...",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Review institution provisioning, domains, plan status, and activation state.
          </p>
        </div>
        <CreateTenantDialog />
      </section>

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
          <div className="grid w-full gap-3 md:max-w-3xl md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, slug, or domain"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tenant status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_payment">Pending payment</SelectItem>
                <SelectItem value="pending_approval">Pending approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Subscription status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subscriptions</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="grace">Grace</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                  </TableCell>
                  <TableCell>{tenant.primary_domain || "Subdomain only"}</TableCell>
                  <TableCell className="uppercase">{tenant.plan_code || "pro"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tenant.subscription_status || "trial"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.status || "draft"}</Badge>
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
