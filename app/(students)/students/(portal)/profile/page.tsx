"use client";

import { useRouter } from "next/navigation";
import { Bell, LifeBuoy, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalStackCard,
} from "@/components/students/portal/portal-page";
import { useStudentProfileQuery } from "@/lib/queries/student";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";

export default function StudentProfilePage() {
  const router = useRouter();
  const { logout, tenant } = useStudentAuthStore();
  const { data, isLoading, error } = useStudentProfileQuery();
  const { data: unreadNotifications = 0 } = useNotificationSummaryQuery("student");
  const participantLabels = getTenantParticipantLabels(tenant);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your profile...",
          "Checking account details...",
          "Preparing account actions...",
        ]}
      />
    );
  }

  if (!data || error) {
    return (
      <PortalEmptyState
        title="Profile unavailable"
        description={(error as Error | undefined)?.message || "Profile is unavailable."}
      />
    );
  }

  const initials = data.full_name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const participantIdentifier = formatParticipantIdentifier(
    data as unknown as Record<string, unknown>,
    tenant,
  );
  const resolvedParticipantIdentifier =
    participantIdentifier || data.email || "Profile access";
  const profileMeta = [
    shouldShowTenantParticipantFieldInProfile(tenant, "college") && data.college
      ? data.college
      : null,
    shouldShowTenantParticipantFieldInProfile(tenant, "department") &&
    data.department
      ? data.department
      : null,
    shouldShowTenantParticipantFieldInProfile(tenant, "level") && data.level
      ? `Level ${data.level}`
      : null,
  ].filter(Boolean);

  return (
    <PortalPage>
      <PortalHero
        eyebrow={`${participantLabels.singular} profile`}
        title={
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={data.photo_url || undefined} alt={data.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="block truncate">{data.full_name}</span>
            </div>
          </div>
        }
        description={[resolvedParticipantIdentifier, ...profileMeta].join(" • ")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push("/students/profile/edit")}>
              Edit profile
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/students/profile/password")}>
              Password
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <PortalStackCard className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{participantLabels.singular} details</p>
          {data.email ? (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{data.email}</span>
            </div>
          ) : null}
          {profileMeta.length > 0 ? (
            <div className="flex items-center gap-3 text-sm">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span>{profileMeta.join(" • ")}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span>
              {data.has_facial_data
                ? "Face verification ready"
                : "Face data not registered"}
            </span>
          </div>
        </PortalStackCard>

        <Card className="border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-sm text-muted-foreground">
              Keep your email and profile photo up to date so voting verification and alerts continue to work cleanly.
            </p>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => router.push("/students/support")}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
              </Button>
              <Button
                variant="outline"
                className="relative justify-start"
                onClick={() => router.push("/students/notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                <NotificationCountBadge
                  count={unreadNotifications}
                  className="absolute right-2 top-2"
                />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout();
                router.replace("/students/login");
              }}
            >
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalPage>
  );
}
