import { Calendar, CheckCircle2, Clock3, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type SessionsOverview = {
  total_sessions: number;
  active_sessions: number;
  upcoming_sessions: number;
  ended_sessions: number;
  total_votes: number;
};

type SessionOverviewCardsProps = {
  overview?: SessionsOverview;
};

const FALLBACK_OVERVIEW: SessionsOverview = {
  total_sessions: 0,
  active_sessions: 0,
  upcoming_sessions: 0,
  ended_sessions: 0,
  total_votes: 0,
};

export function SessionOverviewCards({ overview }: SessionOverviewCardsProps) {
  const data = overview ?? FALLBACK_OVERVIEW;

  const cards = [
    {
      label: "Total Sessions",
      value: data.total_sessions,
      icon: Calendar,
    },
    {
      label: "Active",
      value: data.active_sessions,
      icon: Vote,
    },
    {
      label: "Upcoming",
      value: data.upcoming_sessions,
      icon: Clock3,
    },
    {
      label: "Ended",
      value: data.ended_sessions,
      icon: CheckCircle2,
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
