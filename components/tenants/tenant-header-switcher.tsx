"use client";

import Link from "next/link";
import { Building2, ChevronDown, Link2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTenantWorkspaceSwitch } from "@/hooks/use-tenant-workspace-switch";
import { cn } from "@/lib/utils";

function formatRole(role?: string) {
  if (!role) return "Tenant Admin";
  if (role === "owner") return "Tenant Owner";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TenantHeaderSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { tenant, organizations, membership } = useAuthStore();
  const { switchWorkspace, isSwitching } = useTenantWorkspaceSwitch();

  if (!tenant) {
    return null;
  }

  const availableOrganizations =
    organizations.length > 0
      ? organizations
      : [
          {
            tenant_id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            role: membership?.role || "owner",
            primary_domain: tenant.primary_domain,
            status: tenant.status,
          },
        ];

  const activeOrganization =
    availableOrganizations.find(
      (organization) => organization.slug === tenant.slug,
    ) || availableOrganizations[0];
  const orderedOrganizations = [
    activeOrganization,
    ...availableOrganizations.filter(
      (organization) => organization.slug !== activeOrganization.slug,
    ),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 rounded-2xl border-border/70 bg-background/90 px-2 shadow-sm",
            compact
              ? "h-8 max-w-[170px] min-w-0"
              : "w-[220px] max-w-[220px] justify-between lg:w-60 lg:max-w-60",
            className,
          )}
          disabled={isSwitching}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 p-1.5 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 text-left">
              <p
                className={cn(
                  "truncate font-semibold",
                  compact ? "max-w-[100px] text-xs" : "text-sm",
                )}
              >
                {activeOrganization.name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!compact ? (
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-[10px]"
              >
                {availableOrganizations.length}
              </Badge>
            ) : null}
            <ChevronDown
              className={cn("opacity-60", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "max-w-[calc(100vw-1rem)] rounded-2xl border-border/70 p-1",
          compact ? "w-72" : "w-80",
        )}
      >
        <DropdownMenuLabel className="px-3 py-2">
          Organisations ({availableOrganizations.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orderedOrganizations.map((organization) => {
          const isActive = organization.slug === activeOrganization.slug;
          return (
            <DropdownMenuItem
              key={organization.tenant_id}
              onClick={() => {
                if (organization.slug !== activeOrganization.slug) {
                  void switchWorkspace(organization.slug);
                }
              }}
              className="flex items-start justify-between gap-3 rounded-xl px-3 py-3"
              disabled={isSwitching || availableOrganizations.length === 1}
            >
              <div className="min-w-0">
                <div className="">{organization.name}</div>
                <div className="text-xs text-muted-foreground">
                  {organization.slug}
                  {organization.primary_domain
                    ? ` • ${organization.primary_domain}`
                    : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatRole(organization.role)}
                  {organization.linked ? " • linked" : ""}
                </div>
              </div>
              {isActive ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl px-3 py-3">
          <Link href="/auth/link-organization">
            <Link2 className="mr-2 h-4 w-4" />
            Add another organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
