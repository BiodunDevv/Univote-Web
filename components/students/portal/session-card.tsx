"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudentSessionListItem } from "@/lib/queries/student";
import {
  formatDateRange,
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
  const resolvedCtaLabel =
    session.has_voted && session.status === "active"
      ? "View submitted ballot"
      : ctaLabel;

  const isActive = session.status === "active";
  const isUpcoming = session.status === "upcoming";

  return (
    <div
      className={cn(
        "press-scale group rounded-2xl border shadow-none transition-colors hover:border-border/80",
        isActive && "border-l-4 border-l-[var(--student-vote-accent)]",
      )}
    >
      <div className={cn("space-y-3 p-4", compact && "sm:p-4")}>
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[11px] font-medium", getStatusBadgeClass(session.status))}
          >
            {formatRelativeStatus(session.status)}
          </Badge>
          {session.has_voted ? (
            <Badge variant="outline" className="border-emerald-300/60 bg-emerald-50/50 text-[11px] font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
              Vote recorded
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
              Not voted
            </Badge>
          )}
        </div>

        {/* Title + description */}
        <div className="space-y-1">
          <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            {session.title}
          </h3>
          {!compact && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {session.description || "No additional election description provided."}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="grid gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(session.start_time, session.end_time)}</span>
          </div>
          {!compact && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>{session.candidate_count} candidates on this ballot</span>
            </div>
          )}
          {session.eligibility_scope && !compact && (
            <div className="flex items-center gap-2">
              <Vote className="h-3.5 w-3.5 shrink-0" />
              <span>{session.eligibility_scope.summary}</span>
            </div>
          )}
          {!compact && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {session.is_off_campus_allowed
                  ? "On-campus and off-campus voting enabled"
                  : "On-campus presence required"}
              </span>
            </div>
          )}
        </div>

        {/* CTA footer */}
        <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isActive ? "bg-emerald-500" : isUpcoming ? "bg-amber-400" : "bg-muted-foreground/40",
            )} />
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {isActive
                ? "Open now — cast your vote"
                : isUpcoming
                  ? "Voting opens soon"
                  : "Results available"}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn(
              "h-8 shrink-0 rounded-lg px-3 text-xs font-semibold",
              isActive && "bg-primary text-primary-foreground shadow-none",
            )}
          >
            <Link href={href}>
              {resolvedCtaLabel}
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
