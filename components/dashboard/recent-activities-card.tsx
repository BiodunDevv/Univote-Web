import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardRecentActivity } from "@/components/dashboard/shared/types";

type RecentActivitiesCardProps = {
  activities: DashboardRecentActivity[];
};

export function RecentActivitiesCard({
  activities,
}: RecentActivitiesCardProps) {
  return (
    <Card className="border shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-muted p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user_name} ({activity.user_type})
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recent activities
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
