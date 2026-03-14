import {
  Building2,
  Layers3,
  School2,
  ShieldCheck,
} from "lucide-react";
import { TenantMetricCard, TenantMetricGrid } from "@/components/tenants/shared";

type DepartmentOverviewCardsProps = {
  totals?: {
    total_departments: number;
    active_departments: number;
    inactive_departments: number;
    total_students: number;
  };
};

export function DepartmentOverviewCards({
  totals,
}: DepartmentOverviewCardsProps) {
  const cards = [
    {
      label: "Departments",
      value: totals?.total_departments ?? 0,
      hint: "All department records currently available.",
      icon: <Layers3 className="h-4 w-4" />,
    },
    {
      label: "Active",
      value: totals?.active_departments ?? 0,
      hint: "Departments available for student assignment.",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: "Inactive",
      value: totals?.inactive_departments ?? 0,
      hint: "Departments paused from new operational use.",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      label: "Students",
      value: totals?.total_students ?? 0,
      hint: "Students currently mapped into departments.",
      icon: <School2 className="h-4 w-4" />,
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
