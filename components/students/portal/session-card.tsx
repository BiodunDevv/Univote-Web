"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentSessionListItem } from "@/lib/queries/student";
import {
  formatDateRange,
  formatDateTime,
  formatRelativeStatus,
  getStatusBadgeClass,
} from "@/components/students/portal/utils";

type StudentSessionCardProps = {
  session: StudentSessionListItem;
  href: string;
  ctaLabel?: string;
  compact?: boolean;
};

export function StudentSessionCard({
  session,
  href,
  ctaLabel = "View details",
  compact = false,
}: StudentSessionCardProps) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border shadow-none">
      <CardContent
        className={cn("space-y-3 p-3", compact ? "sm:p-3" : "sm:p-4")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[11px]", getStatusBadgeClass(session.status))}
          >
            {formatRelativeStatus(session.status)}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {session.has_voted ? "Vote recorded" : "Not voted"}
          </Badge>
        </div>
        <div className="space-y-1.5">
          <h3
            className={cn(
              "text-sm font-semibold text-foreground",
              !compact && "sm:text-base",
            )}
          >
            {session.title}
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            {session.description ||
              "No additional session description provided."}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDateRange(session.start_time, session.end_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            <span>Starts {formatDateTime(session.start_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            <span>{session.candidate_count} candidates on this ballot</span>
          </div>
          {session.eligibility_scope ? (
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              <span>{session.eligibility_scope.summary}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {session.is_off_campus_allowed
                ? "On-campus and off-campus voting enabled"
                : "On-campus presence required"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Ballot status
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {session.status === "active"
                ? "You can act on this session now"
                : session.status === "upcoming"
                  ? "Keep this session on your radar"
                  : "Review the final record"}
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 rounded-xl">
            <Link href={href}>
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
