import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  icon: LucideIcon;
  value: number | string;
  label: string;
  iconColor?: string;
  iconBgColor?: string;
};

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: StatCardProps) {
  return (
    <Card className="border p-3 shadow-none sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className={`rounded-lg p-2 ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
