import { Building2, GraduationCap, Users, Vote } from "lucide-react";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { DashboardOverview } from "@/components/dashboard/shared/types";

type MetricsGridProps = {
  overview?: DashboardOverview;
  participantPluralLabel?: string;
  showCollegeMetric?: boolean;
  showDepartmentMetric?: boolean;
};

export function MetricsGrid({
  overview,
  participantPluralLabel = "Participants",
  showCollegeMetric = true,
  showDepartmentMetric = true,
}: MetricsGridProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label={`Total ${participantPluralLabel}`}
        value={overview?.total_students ?? 0}
        icon={Users}
      />
      <MetricCard
        label="Active Sessions"
        value={overview?.active_sessions ?? 0}
        icon={Vote}
      />
      {showCollegeMetric ? (
        <MetricCard
          label="Colleges"
          value={overview?.total_colleges ?? 0}
          icon={Building2}
        />
      ) : null}
      {showDepartmentMetric ? (
        <MetricCard
          label="Departments"
          value={overview?.total_departments ?? 0}
          icon={GraduationCap}
        />
      ) : null}
    </div>
  );
}
