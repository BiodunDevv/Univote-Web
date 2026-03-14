import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardRecentSession } from "@/components/dashboard/shared/types";
import { getSessionStatusDotClass } from "@/components/dashboard/shared/session-status";

type RecentSessionsCardProps = {
  sessions: DashboardRecentSession[];
  onOpenSession: (sessionId: string) => void;
};

function formatSessionDate(value: string) {
  const date = new Date(value);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(date);

  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

export function RecentSessionsCard({
  sessions,
  onOpenSession,
}: RecentSessionsCardProps) {
  return (
    <Card className="border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Sessions</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => onOpenSession(session._id)}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${getSessionStatusDotClass(session.status)}`}
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {session.title}
                  </p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {session.status} • {formatSessionDate(session.start_time)}
                  </p>
                </div>
                <div className="text-xs font-medium">
                  {session.vote_count} votes
                </div>
              </button>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No sessions found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
