import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type WelcomeBannerProps = {
  adminName: string;
  onOpenSettings: () => void;
};

export function WelcomeBanner({
  adminName,
  onOpenSettings,
}: WelcomeBannerProps) {
  return (
    <Card className="border shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Operations Overview
          </p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {adminName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor election activity, student engagement, and live session
              health from one place.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onOpenSettings}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </CardContent>
    </Card>
  );
}
