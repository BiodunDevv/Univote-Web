"use client";

import type { ReactNode } from "react";

export function TenantMetricGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-2 xl:grid-cols-3"
        : "md:grid-cols-2 xl:grid-cols-4";

  return <div className={`grid gap-2 ${gridClass}`}>{children}</div>;
}
