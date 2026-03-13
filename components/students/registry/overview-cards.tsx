import { Card, CardContent } from "@/components/ui/card";
import type { StudentsOverview } from "./types";

type StudentsOverviewCardsProps = {
  overview: StudentsOverview | null;
};

export function StudentsOverviewCards({
  overview,
}: StudentsOverviewCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {overview?.totals.total_students ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {overview?.totals.active_students ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {overview?.totals.inactive_students ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </CardContent>
      </Card>
      <Card className="border shadow-none">
        <CardContent className="p-3">
          <p className="text-lg font-semibold">
            {overview?.totals.with_facial_data ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Face Registered</p>
        </CardContent>
      </Card>
    </section>
  );
}
