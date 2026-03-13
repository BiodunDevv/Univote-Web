import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {totals?.total_departments ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Departments</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {totals?.active_departments ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {totals?.inactive_departments ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">{totals?.total_students ?? 0}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </CardContent>
      </Card>
    </section>
  );
}
