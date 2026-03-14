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
      <CardContent className="p-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-1.5">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground sm:text-xl">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
