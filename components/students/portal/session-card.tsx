"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Users, Vote } from "lucide-react";
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
  const isActive = session.status === "active";
  const isUpcoming = session.status === "upcoming";
  const hasVoted = session.has_voted;

  const resolvedCtaLabel =
    hasVoted && isActive ? "View ballot" : ctaLabel;

  // Compact mode: fully-tappable native-app row
  if (compact) {
    return (
      <Link
        href={href}
        className={cn(
          "press-scale group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors hover:bg-muted/20",
          isActive && "border-l-[3px] border-l-[var(--student-vote-accent)]",
        )}
      >
        {/* Status dot */}
        <span
          className={cn(
            "mt-0.5 h-2 w-2 shrink-0 rounded-full",
            isActive
              ? "animate-pulse bg-emerald-500"
              : isUpcoming
                ? "bg-amber-400"
                : "bg-muted-foreground/30",
          )}
        />

        {/* Title + sub */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {session.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isActive
              ? hasVoted
                ? "Vote recorded"
                : "Live now — tap to vote"
              : isUpcoming
                ? "Opening soon"
                : "Election ended"}
          </p>
        </div>

        {/* Right: voted badge or arrow */}
        {hasVoted ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <ArrowRight className={cn(
            "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
            isActive ? "text-foreground" : "text-muted-foreground",
          )} />
        )}
      </Link>
    );
  }

  // Full mode: detailed card with all meta
  return (
    <div
      className={cn(
        "press-scale group rounded-2xl border shadow-none transition-colors hover:border-border/80",
        isActive && "border-l-4 border-l-[var(--student-vote-accent)]",
      )}
    >
      <div className="space-y-3 p-4">
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[11px] font-medium", getStatusBadgeClass(session.status))}
          >
            {formatRelativeStatus(session.status)}
          </Badge>
          {hasVoted ? (
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
          <h3 className="text-base font-semibold text-foreground">{session.title}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {session.description || "No additional election description provided."}
          </p>
        </div>

        {/* Meta */}
        <div className="grid gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(session.start_time, session.end_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{session.candidate_count} candidates on this ballot</span>
          </div>
          {session.eligibility_scope && (
            <div className="flex items-center gap-2">
              <Vote className="h-3.5 w-3.5 shrink-0" />
              <span>{session.eligibility_scope.summary}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {session.is_off_campus_allowed
                ? "On-campus and off-campus voting enabled"
                : "On-campus presence required"}
            </span>
          </div>
        </div>

        {/* CTA footer */}
        <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isActive ? "animate-pulse bg-emerald-500" : isUpcoming ? "bg-amber-400" : "bg-muted-foreground/40",
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
            className="h-8 shrink-0 rounded-lg px-3 text-xs font-semibold"
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
