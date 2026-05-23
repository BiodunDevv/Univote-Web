"use client";

import { useMemo, useState } from "react";
import { Bell, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminNotificationsQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/lib/queries/admin";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

const defaultPreferences = {
  email_on_new_vote: true,
  email_on_session_end: true,
  email_on_student_upload: true,
  email_on_system_alert: true,
};

export default function NotificationsPage() {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
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
      description: "Notify administrators when new votes land in active elections.",
    },
    {
      key: "email_on_session_end" as const,
      title: "Election end digest",
      description: "Send a summary when an election closes.",
    },
    {
      key: "email_on_student_upload" as const,
      title: `${participantLabels.singular} upload activity`,
      description: `Receive notices after successful or failed ${participantLabels.singular.toLowerCase()} registry uploads.`,
    },
    {
      key: "email_on_system_alert" as const,
      title: "System alerts",
      description: "Highlight infrastructure or verification issues that need action.",
    },
  ];

  return (
    <Tabs
      defaultValue="inbox"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Notification center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review recent operational activity and decide which alerts should
            reach administrators.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="inbox">
            <Bell className="mr-2 h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="inbox" className="mt-0">
        <NotificationFeed
          scope="admin"
          title="Administrator inbox"
          description="Support activity, workflow updates, and tenant events land here in one stream."
        />
      </TabsContent>

      <TabsContent value="preferences" className="mt-0 space-y-5">
        <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border bg-muted p-3">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Delivery preferences
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Control which operational events should also reach
                administrators by email.
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
      </TabsContent>
    </Tabs>
  );
}
