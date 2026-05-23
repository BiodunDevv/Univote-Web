import { Calendar, CheckCircle2, Clock3, Vote } from "lucide-react";
import { TenantMetricCard, TenantMetricGrid } from "@/components/tenants/shared";

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
      label: "Total elections",
      value: data.total_sessions,
      icon: Calendar,
      hint: "All elections currently tracked in the tenant.",
    },
    {
      label: "Active",
      value: data.active_sessions,
      icon: Vote,
      hint: "Elections that are open for voting right now.",
    },
    {
      label: "Upcoming",
      value: data.upcoming_sessions,
      icon: Clock3,
      hint: "Prepared elections waiting for their opening window.",
    },
    {
      label: "Ended",
      value: data.ended_sessions,
      icon: CheckCircle2,
      hint: "Elections already closed and available for review.",
    },
  ];

  return (
    <TenantMetricGrid>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <TenantMetricCard
            key={card.label}
            label={card.label}
            value={card.value.toLocaleString()}
            hint={card.hint}
            icon={<Icon className="h-4 w-4" />}
          />
        );
      })}
    </TenantMetricGrid>
  );
}
