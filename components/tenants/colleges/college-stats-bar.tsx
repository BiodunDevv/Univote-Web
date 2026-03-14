"use client";

import { Building2, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CollegeStatistics } from "./types";

type CollegeStatsBarProps = {
  statistics: CollegeStatistics | null;
  loading?: boolean;
  participantPluralLabel?: string;
};

function StatSkeleton() {
  return (
    <Card className="border shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CollegeStatsBar({
  statistics,
  loading,
  participantPluralLabel = "Participants",
}: CollegeStatsBarProps) {
  if (loading) {
    return (
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Colleges",
      value: statistics?.total_colleges ?? 0,
      icon: Building2,
    },
    {
      label: "Active",
      value: statistics?.active_colleges ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Departments",
      value: statistics?.total_departments ?? 0,
      icon: GraduationCap,
    },
    {
      label: participantPluralLabel,
      value: statistics?.total_students ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border shadow-none">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-muted p-2">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
