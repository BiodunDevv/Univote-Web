import {
  UserCheck2,
  UserMinus2,
  Users,
  ScanFace,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { TenantMetricCard, TenantMetricGrid } from "@/components/tenants/shared";
import type { StudentsOverview } from "./types";

type StudentsOverviewCardsProps = {
  overview: StudentsOverview | null;
};

export function StudentsOverviewCards({
  overview,
}: StudentsOverviewCardsProps) {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const cards = [
    {
      label: `Total ${participantLabels.plural.toLowerCase()}`,
      value: overview?.totals.total_students ?? 0,
      hint: `All registered ${participantLabels.plural.toLowerCase()} in the tenant workspace.`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Active",
      value: overview?.totals.active_students ?? 0,
      hint: `${participantLabels.plural} currently allowed to access and vote.`,
      icon: <UserCheck2 className="h-4 w-4" />,
    },
    {
      label: "Inactive",
      value: overview?.totals.inactive_students ?? 0,
      hint: "Profiles currently blocked from the portal.",
      icon: <UserMinus2 className="h-4 w-4" />,
    },
    {
      label: "Face ready",
      value: overview?.totals.with_facial_data ?? 0,
      hint: `${participantLabels.plural} with completed facial verification records.`,
      icon: <ScanFace className="h-4 w-4" />,
    },
  ];

  return (
    <TenantMetricGrid>
      {cards.map((card) => (
        <TenantMetricCard
          key={card.label}
          label={card.label}
          value={card.value.toLocaleString()}
          hint={card.hint}
          icon={card.icon}
        />
      ))}
    </TenantMetricGrid>
  );
}
