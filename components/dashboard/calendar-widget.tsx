"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardRecentSession } from "@/components/dashboard/shared/types";
import { getSessionStatusDotClass } from "@/components/dashboard/shared/session-status";

type CalendarWidgetProps = {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  recentSessions: DashboardRecentSession[];
  onOpenSession: (sessionId: string) => void;
};

export function CalendarWidget({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  recentSessions,
  onOpenSession,
}: CalendarWidgetProps) {
  const currentDate = new Date();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = currentDate.getDate();
  const isCurrentMonth =
    currentMonth.getMonth() === currentDate.getMonth() &&
    currentMonth.getFullYear() === currentDate.getFullYear();

  const getSessionsForDate = (day: number) => {
    return recentSessions.filter((session) => {
      const sessionDate = new Date(session.start_time);
      return (
        sessionDate.getDate() === day &&
        sessionDate.getMonth() === currentMonth.getMonth() &&
        sessionDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const upcomingOrActive = recentSessions
    .filter((s) => s.status === "upcoming" || s.status === "active")
    .slice(0, 3);

  return (
    <Card className="h-full border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Calendar</CardTitle>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {monthName} {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <TooltipProvider>
          <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="py-1.5 font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="py-1.5" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === today;
              const sessionsOnDate = getSessionsForDate(day);
              const hasSessions = sessionsOnDate.length > 0;

              const dateElement = (
                <button
                  type="button"
                  onClick={() => {
                    if (hasSessions) {
                      onOpenSession(sessionsOnDate[0]._id);
                    }
                  }}
                  className={`relative w-full rounded-full py-1.5 transition-colors ${
                    isToday
                      ? "cursor-pointer bg-primary font-semibold text-primary-foreground"
                      : hasSessions
                        ? "cursor-pointer bg-blue-100 font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        : "cursor-default hover:bg-accent"
                  }`}
                >
                  {day}
                  {hasSessions && (
                    <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {sessionsOnDate.slice(0, 3).map((session) => (
                        <span
                          key={session._id}
                          className={`h-1 w-1 rounded-full ${getSessionStatusDotClass(session.status)}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );

              return hasSessions ? (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>{dateElement}</TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      {sessionsOnDate.map((session) => (
                        <div key={session._id} className="text-xs">
                          <p className="font-medium">{session.title}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getSessionStatusDotClass(session.status)}`}
                            />
                            <span className="capitalize">{session.status}</span>
                          </div>
                        </div>
                      ))}
                      <p className="mt-2 text-xs italic text-muted-foreground">
                        Click to view session details
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={day}>{dateElement}</div>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="space-y-2 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Upcoming Sessions
          </p>
          {upcomingOrActive.length > 0 ? (
            upcomingOrActive.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => onOpenSession(session._id)}
                className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs transition-colors hover:bg-accent"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${getSessionStatusDotClass(session.status)}`}
                />
                <span className="flex-1 truncate font-medium">
                  {session.title}
                </span>
              </button>
            ))
          ) : (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No upcoming sessions
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
