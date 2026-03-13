import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
