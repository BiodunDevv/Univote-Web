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
  const resolvedAdminRole =
    admin?.role || sharedAdminContext?.admin.role || null;
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
    setSelectedSlug((current) =>
      current === resolvedTenantSlug ? current : resolvedTenantSlug,
    );
  }, [resolvedTenantSlug]);

  if (
    resolvedAdminRole === "super_admin" ||
    resolvedOrganizations.length === 0
  ) {
    return null;
  }

  const selectedOrganization =
    resolvedOrganizations.find(
      (organization) => organization.slug === selectedSlug,
    ) || resolvedOrganizations[0];
  const canSwitchWithApi = Boolean(
    token && admin && admin.role !== "super_admin",
  );

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
        "flex items-center gap-2 rounded-2xl border border-border/60 bg-background/85 p-1 shadow-sm backdrop-blur-xl",
        compact ? "w-auto min-w-0 max-w-[152px]" : "min-w-[290px]",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground",
          compact ? "hidden" : "hidden h-9 w-9 sm:flex",
        )}
      >
        <Building2 className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <Select
          value={selectedSlug}
          onValueChange={setSelectedSlug}
          disabled={isSwitching}
        >
          <SelectTrigger
            className={cn(
              "w-full border-0 bg-transparent text-left shadow-none focus:ring-0",
              compact ? "h-7 px-1.5 text-xs" : "h-8 px-2",
            )}
          >
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
        className={cn(
          "rounded-lg",
          compact ? "h-7 px-2 text-xs" : "h-7 px-3",
        )}
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
