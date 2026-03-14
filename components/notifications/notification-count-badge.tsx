"use client";

import { Badge } from "@/components/ui/badge";

export function NotificationCountBadge({
  count,
  className = "",
}: {
  count?: number | null;
  className?: string;
}) {
  if (!count || count <= 0) {
    return null;
  }

  return (
    <Badge
      variant="default"
      className={`h-5 min-w-5 rounded-full px-1.5 text-[10px] font-semibold ${className}`.trim()}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
