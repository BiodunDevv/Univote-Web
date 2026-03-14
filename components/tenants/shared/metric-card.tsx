"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { compactUi } from "@/lib/compact-ui";

export function TenantMetricCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80 shadow-none",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-2">
        <div className="space-y-1.5">
          <p className={compactUi.typography.eyebrow}>
            {label}
          </p>
          <div className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {value}
          </div>
          {hint ? (
            <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-2 text-foreground">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
