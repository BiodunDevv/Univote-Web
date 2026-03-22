"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { cn } from "@/lib/utils";

export function TenantHeaderSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { tenant } = useAuthStore();

  if (!tenant) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 rounded-2xl border-border/70 bg-background/90 px-2 shadow-sm",
        compact
          ? "h-8 max-w-[170px] min-w-0"
          : "w-[220px] max-w-[220px] justify-start lg:w-60 lg:max-w-60",
        className,
      )}
      disabled
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
            {tenant.name}
          </p>
          {!compact ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {tenant.primary_domain || tenant.slug}
            </p>
          ) : null}
        </div>
      </div>
    </Button>
  );
}
