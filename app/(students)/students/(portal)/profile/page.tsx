"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Headset,
  LockKeyhole,
  LogOut,
  Mail,
  Palette,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
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
import { StudentLogoutConfirmDialog } from "@/components/students/portal/logout-confirm-dialog";
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
    <button
      type="button"
      onClick={onClick}
      className="press-scale flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
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
    </button>
  );
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { logout, tenant } = useStudentAuthStore();
  const { data, isLoading, error } = useStudentProfileQuery();
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("student");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
        icon={UserRound}
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

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      router.replace("/students/login");
    } finally {
      setIsLoggingOut(false);
    }
  };
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
      {/* Hero with inline avatar */}
      <PortalHero
        eyebrow={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/students/profile/edit")}
              className="press-scale group relative shrink-0"
              aria-label="Edit profile photo"
            >
              <Avatar className="h-9 w-9 rounded-full border border-border/60">
                <AvatarImage
                  className="object-cover"
                  src={showPhotoField ? data.photo_url || undefined : undefined}
                  alt={data.full_name}
                />
                <AvatarFallback className="text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
            <span>{participantLabels.singular} account</span>
          </div>
        }
        title={data.full_name}
        description={
          [resolvedParticipantIdentifier, ...profileMeta].filter(Boolean).join(" · ") || undefined
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-xl"
            onClick={() => router.push("/students/profile/edit")}
          >
            Edit profile
          </Button>
        }
      />

      {/* Account chips */}
      <div className="animate-slide-up-1 grid gap-2 sm:grid-cols-2">
        {data.email ? (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-foreground">{data.email}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">
            {participantLabels.singular} account
          </span>
        </div>
        {showFaceField ? (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 sm:col-span-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {data.has_facial_data
                ? "Face verification enrolled"
                : "Face data not registered"}
            </span>
          </div>
        ) : null}
      </div>

      {/* Photo update notice */}
      {showPhotoField ? (
        <div className="animate-slide-up-2 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Photo update window
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {nextPhotoUpdateLabel
                ? `Next self-service update: ${nextPhotoUpdateLabel}. Need it sooner? Request a reset in Edit profile.`
                : "Your profile photo can be updated from Edit profile."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Settings card */}
      <Card className="animate-slide-up-3 border shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Account settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-3 pb-3">
          <div className="rounded-xl border bg-muted/10 p-1">
            <SettingAction
              icon={UserRound}
              label="Edit profile"
              description="Update name, email, and photo"
              onClick={() => router.push("/students/profile/edit")}
            />
            <Separator className="my-1 mx-2" />
            <SettingAction
              icon={LockKeyhole}
              label="Password"
              description="Change your sign-in password"
              onClick={() => router.push("/students/profile/password")}
            />
            <Separator className="my-1 mx-2" />
            <SettingAction
              icon={Bell}
              label="Notifications"
              description="Alerts and voting updates"
              trailing={
                <NotificationCountBadge
                  count={unreadNotifications}
                  className="static"
                />
              }
              onClick={() => router.push("/students/notifications")}
            />
            <Separator className="my-1 mx-2" />
            <SettingAction
              icon={Headset}
              label="Support"
              description="Get help with your account"
              onClick={() => router.push("/students/support")}
            />
          </div>

          {/* Theme toggle */}
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                Appearance
              </p>
            </div>
            <AnimatedThemeToggler variant="mobile" />
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="press-scale flex w-full items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </CardContent>
      </Card>

      <StudentLogoutConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={handleLogout}
        isPending={isLoggingOut}
        studentName={data.full_name}
      />
    </PortalPage>
  );
}
