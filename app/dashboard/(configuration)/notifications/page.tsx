"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminNotificationsQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const defaultPreferences = {
  email_on_new_vote: true,
  email_on_session_end: true,
  email_on_student_upload: true,
  email_on_system_alert: true,
};

export default function NotificationsPage() {
  const notificationsQuery = useAdminNotificationsQuery();
  const updatePreferences = useUpdateNotificationPreferencesMutation();
  const [draftPreferences, setDraftPreferences] = useState<
    Partial<typeof defaultPreferences>
  >({});
  const preferences = useMemo(
    () => ({
      ...defaultPreferences,
      ...notificationsQuery.data?.notification_preferences,
      ...draftPreferences,
    }),
    [draftPreferences, notificationsQuery.data?.notification_preferences],
  );

  if (notificationsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading notification preferences...",
          "Syncing administrator alerts...",
          "Preparing delivery controls...",
        ]}
      />
    );
  }

  const items = [
    {
      key: "email_on_new_vote" as const,
      title: "New vote alerts",
      description: "Notify administrators when new votes land in active sessions.",
    },
    {
      key: "email_on_session_end" as const,
      title: "Session end digest",
      description: "Send a summary when a voting session closes.",
    },
    {
      key: "email_on_student_upload" as const,
      title: "Student upload activity",
      description: "Receive notices after successful or failed registry uploads.",
    },
    {
      key: "email_on_system_alert" as const,
      title: "System alerts",
      description: "Highlight infrastructure or verification issues that need action.",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Notification Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Control which operational events should reach administrators by email.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.key} className="border shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={Boolean(preferences[item.key])}
                onCheckedChange={(checked) =>
                  setDraftPreferences((current) => ({
                    ...current,
                    [item.key]: checked,
                  }))
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={updatePreferences.isPending}
          onClick={async () => {
            await updatePreferences.mutateAsync(preferences);
            setDraftPreferences({});
            toast.success("Notification preferences saved");
          }}
        >
          {updatePreferences.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
