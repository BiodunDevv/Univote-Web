"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentSessionListItem } from "@/lib/queries/student";
import {
  formatDateRange,
  formatRelativeStatus,
  getStatusBadgeClass,
} from "@/components/students-portal/utils";

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
    <Card className="border shadow-none">
      <CardHeader className={cn("gap-3", compact ? "pb-3" : "pb-4")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={getStatusBadgeClass(session.status)}>
            {formatRelativeStatus(session.status)}
          </Badge>
          <Badge variant="outline">
            {session.has_voted ? "Vote recorded" : "Not voted"}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className={cn(compact ? "text-base" : "text-lg")}>
            {session.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {session.description || "No additional session description provided."}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{formatDateRange(session.start_time, session.end_time)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Vote className="h-4 w-4" />
          <span>{session.candidate_count} candidates on this ballot</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {session.is_off_campus_allowed
              ? "On-campus and off-campus voting enabled"
              : "On-campus presence required"}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full sm:w-auto">
          <Link href={href}>
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
