"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Building2, ChevronRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  readSharedAdminContext,
  subscribeSharedAdminContext,
} from "@/lib/shared-admin-context";
import { buildTenantAppUrl } from "@/lib/tenant";
import { useTenantWorkspaceSwitch } from "@/hooks/use-tenant-workspace-switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LandingOrganizationSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export function LandingOrganizationSwitcher({
  compact = false,
  className,
}: LandingOrganizationSwitcherProps) {
  const sharedAdminContext = useSyncExternalStore(
    subscribeSharedAdminContext,
    readSharedAdminContext,
    () => null,
  );
  const { token, admin, tenant, organizations } = useAuthStore();
  const { switchWorkspace, isSwitching } = useTenantWorkspaceSwitch();
  const resolvedAdminRole = admin?.role || sharedAdminContext?.admin.role || null;
  const resolvedOrganizations =
    organizations.length > 0
      ? organizations
      : sharedAdminContext?.organizations || [];
  const resolvedTenantSlug =
    tenant?.slug ||
    sharedAdminContext?.tenant?.slug ||
    resolvedOrganizations[0]?.slug ||
    "";
  const [selectedSlug, setSelectedSlug] = useState(resolvedTenantSlug);

  useEffect(() => {
    setSelectedSlug(resolvedTenantSlug);
  }, [resolvedTenantSlug]);

  if (
    resolvedAdminRole === "super_admin" ||
    resolvedOrganizations.length === 0
  ) {
    return null;
  }

  const selectedOrganization =
    resolvedOrganizations.find((organization) => organization.slug === selectedSlug) ||
    resolvedOrganizations[0];
  const canSwitchWithApi = Boolean(token && admin && admin.role !== "super_admin");

  const handleOpenWorkspace = () => {
    if (!selectedOrganization) return;

    if (canSwitchWithApi) {
      void switchWorkspace(selectedOrganization.slug);
      return;
    }

    window.location.assign(
      buildTenantAppUrl(selectedOrganization.slug, "/dashboard"),
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border/60 bg-background/85 p-1.5 shadow-sm backdrop-blur-xl",
        compact ? "w-full max-w-[260px]" : "min-w-[290px]",
        className,
      )}
    >
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground sm:flex">
        <Building2 className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {resolvedOrganizations.length > 1
            ? `${resolvedOrganizations.length} organisations`
            : "Active organisation"}
        </p>
        <Select
          value={selectedSlug}
          onValueChange={setSelectedSlug}
          disabled={isSwitching}
        >
          <SelectTrigger className="h-8 border-0 bg-transparent px-2 shadow-none focus:ring-0">
            <SelectValue placeholder="Select organisation" />
          </SelectTrigger>
          <SelectContent>
            {resolvedOrganizations.map((organization) => (
              <SelectItem key={organization.slug} value={organization.slug}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        className={cn("h-9 rounded-xl px-3", compact && "px-2.5")}
        disabled={!selectedOrganization || isSwitching}
        onClick={handleOpenWorkspace}
      >
        {isSwitching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : compact ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            Open
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
