"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Headset,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
import { AnimatedThemeToggler } from "@/components/theme-toggler";
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
  const showPhotoField = shouldShowTenantParticipantFieldInProfile(
    tenant,
    "photo_url",
  );
  const showFaceField = shouldShowTenantParticipantFieldInProfile(
    tenant,
    "face_verification",
  );

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
  const nextPhotoUpdateLabel = data.next_profile_photo_update_at
    ? new Date(data.next_profile_photo_update_at).toLocaleDateString("en-NG", {
        dateStyle: "medium",
      })
    : null;

  return (
    <PortalPage>
      <PortalHero
        eyebrow={`${participantLabels.singular} profile`}
        title={
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage
                src={showPhotoField ? data.photo_url || undefined : undefined}
                alt={data.full_name}
              />
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

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.06fr)_minmax(300px,0.94fr)]">
        <PortalStackCard className="space-y-4 rounded-[2rem] p-4">
          <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <Avatar className="h-20 w-20 rounded-[1.5rem] border bg-muted/40">
              <AvatarImage
                src={showPhotoField ? data.photo_url || undefined : undefined}
                alt={data.full_name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{data.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {resolvedParticipantIdentifier}
              </p>
              {profileMeta.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {profileMeta.join(" • ")}
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{participantLabels.singular} details</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Keep your identity and verification details current so sign-in and
              ballot verification stay smooth.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.email ? (
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{data.email}</span>
              </div>
            ) : null}
            {profileMeta.length > 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-3 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span>{profileMeta.join(" • ")}</span>
              </div>
            ) : null}
            {showFaceField ? (
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-3 text-sm sm:col-span-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>
                  {data.has_facial_data
                    ? "Face verification ready"
                    : "Face data not registered"}
                </span>
              </div>
            ) : null}
          </div>
          {showPhotoField ? (
            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Profile photo update window
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {nextPhotoUpdateLabel
                      ? `Your next self-service photo update opens on ${nextPhotoUpdateLabel}. If you need an earlier change, request a reset from the edit profile screen.`
                      : "Your profile photo is currently available for self-service update from the edit profile screen."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </PortalStackCard>

        <Card className="rounded-[2rem] border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-sm text-muted-foreground">
              {showPhotoField
                ? "Keep your details current so login recovery, profile approval, and voting verification stay smooth."
                : "Keep your account details current so alerts and access recovery continue to work cleanly."}
            </p>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-between rounded-2xl"
                onClick={() => router.push("/students/profile/edit")}
              >
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Edit profile
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="justify-between rounded-2xl"
                onClick={() => router.push("/students/profile/password")}
              >
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" />
                  Password
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="relative justify-between rounded-2xl"
                onClick={() => router.push("/students/notifications")}
              >
                <span className="inline-flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  <NotificationCountBadge
                    count={unreadNotifications}
                    className="static"
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-between rounded-2xl"
                onClick={() => router.push("/students/support")}
              >
                <span className="inline-flex items-center gap-2">
                  <Headset className="h-4 w-4" />
                  Support
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="rounded-2xl border bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Theme
                </div>
                <AnimatedThemeToggler
                  variant="with-text"
                  className="justify-start rounded-xl border border-input bg-background px-3"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-2xl"
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
