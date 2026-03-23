"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Headset,
  LockKeyhole,
  Mail,
  Palette,
  LogOut,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
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
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  shouldShowTenantParticipantFieldInProfile,
} from "@/lib/tenant-config";

type SettingActionProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  trailing?: ReactNode;
};

function SettingAction({
  icon: Icon,
  label,
  description,
  onClick,
  trailing,
}: SettingActionProps) {
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-between rounded-2xl px-3 py-3"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {trailing}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </span>
    </Button>
  );
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { logout, tenant } = useStudentAuthStore();
  const { data, isLoading, error } = useStudentProfileQuery();
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("student");
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
        description={
          (error as Error | undefined)?.message || "Profile is unavailable."
        }
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
  const participantDetailSummary =
    profileMeta.length > 0 ? profileMeta.join(" • ") : null;

  return (
    <PortalPage>
      <div className="mx-auto w-full max-w-full space-y-4">
        <PortalStackCard className="space-y-4 rounded-2xl border p-4 shadow-none">
          <div className="flex items-center gap-3">
            <Avatar className="h-20 w-20 rounded-full border bg-muted/40">
              <AvatarImage
                className="object-cover"
                src={showPhotoField ? data.photo_url || undefined : undefined}
                alt={data.full_name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-lg font-semibold text-foreground">
                {data.full_name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {resolvedParticipantIdentifier}
              </p>
              {participantDetailSummary ? (
                <p className="truncate text-xs text-muted-foreground">
                  {participantDetailSummary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {data.email ? (
              <div className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-3 py-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{data.email}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-3 py-2 text-sm">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {participantLabels.singular} account
              </span>
            </div>
            {showFaceField ? (
              <div className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-3 py-2 text-sm sm:col-span-2">
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
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Photo update window
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {nextPhotoUpdateLabel
                      ? `Next self-service update: ${nextPhotoUpdateLabel}. Need it sooner? Request a reset in Edit profile.`
                      : "Your profile photo can be updated from Edit profile."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </PortalStackCard>

        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="pb-2 px-4">
            <CardTitle className="text-base">Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your account and app preferences.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="rounded-2xl border bg-card p-1">
              <SettingAction
                icon={UserRound}
                label="Edit profile"
                description="Update personal and identity details"
                onClick={() => router.push("/students/profile/edit")}
              />
              <Separator className="my-1" />
              <SettingAction
                icon={LockKeyhole}
                label="Password"
                description="Change your sign-in password"
                onClick={() => router.push("/students/profile/password")}
              />
              <Separator className="my-1" />
              <SettingAction
                icon={Bell}
                label="Notifications"
                description="View alerts and updates"
                trailing={
                  <NotificationCountBadge
                    count={unreadNotifications}
                    className="static"
                  />
                }
                onClick={() => router.push("/students/notifications")}
              />
              <Separator className="my-1" />
              <SettingAction
                icon={Headset}
                label="Support"
                description="Get help with account or voting"
                onClick={() => router.push("/students/support")}
              />
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Palette className="h-4 w-4 text-muted-foreground" />
                Theme
              </div>
              <AnimatedThemeToggler variant="mobile" />
            </div>

            <Button
              variant="outline"
              className="w-full justify-center gap-2 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                await logout();
                router.replace("/students/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalPage>
  );
}
