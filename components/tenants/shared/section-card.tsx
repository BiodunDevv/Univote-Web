"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { compactUi } from "@/lib/compact-ui";

export function TenantSectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("rounded-[1.75rem] border border-border/70 shadow-none", className)}>
      <CardHeader className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className={compactUi.typography.sectionTitle}>{title}</CardTitle>
          {description ? <CardDescription className="mt-1 text-xs">{description}</CardDescription> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("px-3 pb-3 pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
