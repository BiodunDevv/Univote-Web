"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Server,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import {
  TenantMetricCard,
  TenantMetricGrid,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenantProfileSettingsQuery, useUpdateTenantProfileSettingsMutation } from "@/lib/queries/admin";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

type SettingsTab = "profile" | "security" | "system";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, token, hasHydrated, updateAdmin, updateTenant, tenant, membership } =
    useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const tenantProfileQuery = useTenantProfileSettingsQuery({
    enabled: hasHydrated && Boolean(token) && !isSuperAdmin,
  });
  const updateTenantProfileSettings = useUpdateTenantProfileSettingsMutation();
  const {
    profile,
    systemConfig,
    systemHealth,
    databaseStats,
    getProfile,
    updateProfile,
    changePassword,
    getSystemConfig,
    getSystemHealth,
    getDatabaseStats,
    testEmail,
    loading,
    error,
    clearError,
  } = useSettingsStore();

  const initialTab = useMemo<SettingsTab>(() => {
    const tabParam = searchParams.get("tab");
    return tabParam === "security" || tabParam === "system"
      ? tabParam
      : "profile";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [emailTestMessage, setEmailTestMessage] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [tenantProfileSaving, setTenantProfileSaving] = useState(false);
  const [tenantProfileMessage, setTenantProfileMessage] = useState("");

  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantSupportEmail, setTenantSupportEmail] = useState("");
  const [tenantContactName, setTenantContactName] = useState("");
  const [tenantContactEmail, setTenantContactEmail] = useState("");
  const [tenantContactPhone, setTenantContactPhone] = useState("");

  const lastProfileSyncKey = useRef<string | null>(null);
  const canManageTenantSettings = hasAnyTenantPermission(membership, [
    "tenant.settings.manage",
    "tenant.manage",
  ]);
  const isLoadingProfile = loading && !profile;
  const systemChecks = systemHealth
    ? (Object.entries(systemHealth.checks) as Array<
        [
          keyof typeof systemHealth.checks,
          (typeof systemHealth.checks)[keyof typeof systemHealth.checks],
        ]
      >)
    : [];

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (hasHydrated && token) {
      void getProfile(token);
      if (isSuperAdmin) {
        void getSystemConfig(token);
        void getSystemHealth(token);
        void getDatabaseStats(token);
      }
    }
  }, [
    getDatabaseStats,
    getProfile,
    getSystemConfig,
    getSystemHealth,
    hasHydrated,
    isSuperAdmin,
    token,
  ]);

  useEffect(() => {
    if (!profile) return;

    const syncKey = [
      profile._id || "",
      profile.updatedAt || "",
      profile.full_name || "",
      profile.email || "",
    ].join(":");

    if (lastProfileSyncKey.current === syncKey) {
      return;
    }

    setFullName(profile.full_name || "");
    setEmail(profile.email || "");
    lastProfileSyncKey.current = syncKey;
  }, [profile]);

  useEffect(() => {
    const tenantProfile = tenantProfileQuery.data?.tenant;
    if (!tenantProfile) return;

    setTenantName(tenantProfile.name || "");
    setTenantSlug(tenantProfile.slug || "");
    setTenantDomain(tenantProfile.primary_domain || "");
    setTenantSupportEmail(tenantProfile.branding?.support_email || "");
    setTenantContactName(tenantProfile.onboarding?.contact_name || "");
    setTenantContactEmail(tenantProfile.onboarding?.contact_email || "");
    setTenantContactPhone(tenantProfile.onboarding?.contact_phone || "");
  }, [tenantProfileQuery.data?.tenant]);

  if (!hasHydrated || !token || !admin) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Loading system settings...",
          "Fetching your profile...",
          "Preparing configuration panel...",
        ]}
      />
    );
  }

  const handleTabChange = (nextTab: string) => {
    const safeTab: SettingsTab =
      nextTab === "security" || (nextTab === "system" && isSuperAdmin)
        ? nextTab
        : "profile";
    setActiveTab(safeTab);
    router.push(`/dashboard/settings?tab=${safeTab}`);
  };

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage("");
    clearError();
    setProfileSaving(true);

    try {
      const updatedProfile = await updateProfile(token, {
        full_name: fullName,
        email,
      });
      lastProfileSyncKey.current = [
        updatedProfile._id || "",
        updatedProfile.updatedAt || "",
        updatedProfile.full_name || "",
        updatedProfile.email || "",
      ].join(":");
      updateAdmin({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
      });
      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileMessage("");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    clearError();

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch {
      setPasswordMessage("");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTestMessage("");
    clearError();

    if (!testEmailAddress.trim()) {
      setEmailTestMessage("Enter a recipient email address first.");
      return;
    }

    setEmailTesting(true);
    try {
      await testEmail(token, testEmailAddress.trim());
      setEmailTestMessage("Test email sent successfully.");
    } catch {
      setEmailTestMessage("");
    } finally {
      setEmailTesting(false);
    }
  };

  const handleTenantProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setTenantProfileMessage("");
    setTenantProfileSaving(true);

    try {
      const response = await updateTenantProfileSettings.mutateAsync({
        name: tenantName,
        slug: tenantSlug,
        primary_domain: tenantDomain || null,
        support_email: tenantSupportEmail || null,
        contact_name: tenantContactName || null,
        contact_email: tenantContactEmail || null,
        contact_phone: tenantContactPhone || null,
      });
      updateTenant(response.tenant);
      setTenantProfileMessage("University profile updated successfully.");
    } catch (saveError) {
      setTenantProfileMessage(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update university profile.",
      );
    } finally {
      setTenantProfileSaving(false);
    }
  };

  const roleLabel =
    profile?.role === "super_admin" || admin.role === "super_admin"
      ? "Super Admin"
      : "Tenant Admin";
  const profileEmail = profile?.email || admin.email;
  const profileName = profile?.full_name || admin.full_name;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant settings"
        icon={<Shield className="h-5 w-5" />}
        title="Settings"
        subtitle="Manage your administrator account, university workspace profile, and operational security from one responsive settings surface."
        stats={[
          { label: "Profile", value: profileName },
          { label: "Role", value: roleLabel },
          { label: "Health", value: systemHealth?.status || "Monitoring" },
          {
            label: "Database",
            value: databaseStats ? "Connected" : "Pending",
          },
        ]}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-1 border-b border-border/70 px-0 pb-2"
        >
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2">
            Security
          </TabsTrigger>
          {isSuperAdmin ? (
            <TabsTrigger value="system" className="rounded-xl px-4 py-2">
              System
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <TenantMetricGrid columns={3}>
            <TenantMetricCard
              label="Admin role"
              value={roleLabel}
              hint="This determines which tenant and platform surfaces you can access."
              icon={<User className="h-4 w-4" />}
            />
            <TenantMetricCard
              label="Primary email"
              value={profileEmail}
              hint="Used for operational notices and security recovery."
              icon={<Mail className="h-4 w-4" />}
            />
            <TenantMetricCard
              label="Account state"
              value="Verified"
              hint="This administrator account is ready for production actions."
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </TenantMetricGrid>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <TenantSectionCard
              title="Profile information"
              description="Update your display name and primary email without leaving the tenant workspace."
              contentClassName="space-y-4"
            >
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-40" />
                </div>
              ) : (
                <form
                  onSubmit={handleProfileUpdate}
                  className="grid gap-4 lg:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={roleLabel}
                      disabled
                      className="h-11 bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Workspace access</Label>
                    <Input
                      value={isSuperAdmin ? "Global platform" : "Tenant scoped"}
                      disabled
                      className="h-11 bg-muted/40"
                    />
                  </div>
                  {profileMessage ? (
                    <Alert className="lg:col-span-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{profileMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex justify-end lg:col-span-2">
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="h-10"
                    >
                      {profileSaving ? (
                        <LoadingButtonContent label="Saving profile changes..." />
                      ) : (
                        "Save profile changes"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </TenantSectionCard>

            <TenantSectionCard
              title="Account summary"
              description="A quick read on the current identity behind this session."
              contentClassName="space-y-3"
            >
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {profileName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profileEmail}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                <span className="text-sm text-muted-foreground">
                  Role access
                </span>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                <span className="text-sm text-muted-foreground">
                  Last configuration sync
                </span>
                <span className="text-sm font-medium text-foreground">
                  Live
                </span>
              </div>
            </TenantSectionCard>
          </div>

          {!isSuperAdmin ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <TenantSectionCard
                title="University profile"
                description="Update the university name, slug, and core contact details used across the workspace."
                contentClassName="space-y-4"
              >
                <form
                  onSubmit={handleTenantProfileSave}
                  className="grid gap-4 lg:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">University name</Label>
                    <Input
                      id="tenant-name"
                      value={tenantName}
                      onChange={(event) => setTenantName(event.target.value)}
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-slug">Slug</Label>
                    <Input
                      id="tenant-slug"
                      value={tenantSlug}
                      onChange={(event) => setTenantSlug(event.target.value)}
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-domain">Primary domain</Label>
                    <Input
                      id="tenant-domain"
                      value={tenantDomain}
                      onChange={(event) => setTenantDomain(event.target.value)}
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                      placeholder="vote.university.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-support-email">Support email</Label>
                    <Input
                      id="tenant-support-email"
                      type="email"
                      value={tenantSupportEmail}
                      onChange={(event) =>
                        setTenantSupportEmail(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-contact-name">Contact name</Label>
                    <Input
                      id="tenant-contact-name"
                      value={tenantContactName}
                      onChange={(event) =>
                        setTenantContactName(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-contact-email">Contact email</Label>
                    <Input
                      id="tenant-contact-email"
                      type="email"
                      value={tenantContactEmail}
                      onChange={(event) =>
                        setTenantContactEmail(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-contact-phone">Contact phone</Label>
                    <Input
                      id="tenant-contact-phone"
                      value={tenantContactPhone}
                      onChange={(event) =>
                        setTenantContactPhone(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  {tenantProfileMessage ? (
                    <Alert className="lg:col-span-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{tenantProfileMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex justify-end lg:col-span-2">
                    <Button
                      type="submit"
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                    >
                      {tenantProfileSaving
                        ? "Saving..."
                        : "Save university profile"}
                    </Button>
                  </div>
                </form>
              </TenantSectionCard>

              <TenantSectionCard
                title="Workspace summary"
                description="The live university identity currently attached to this admin session."
                contentClassName="space-y-3"
              >
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {tenantProfileQuery.data?.tenant?.name ||
                      tenant?.name ||
                      "University workspace"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tenantProfileQuery.data?.tenant?.slug ||
                      tenant?.slug ||
                      "No slug"}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <span className="text-sm text-muted-foreground">
                    Support email
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {tenantSupportEmail || "Not configured"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <span className="text-sm text-muted-foreground">
                    Workspace domain
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {tenantDomain || "Using default tenant routing"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Univote applies the default university identity model
                  automatically. Identifier rules, terminology, participant
                  structure, branding colors, and vote verification thresholds
                  are managed as platform defaults.
                </div>
              </TenantSectionCard>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <TenantMetricGrid columns={3}>
            <TenantMetricCard
              label="Password policy"
              value="8+ chars"
              hint="Use a unique password with a mix of letters, numbers, and symbols."
              icon={<Lock className="h-4 w-4" />}
            />
            <TenantMetricCard
              label="Recovery email"
              value={profileEmail}
              hint="Password recovery and account notices are sent here."
              icon={<Mail className="h-4 w-4" />}
            />
            <TenantMetricCard
              label="Session protection"
              value="Active"
              hint="Tenant session restrictions and auth guards are applied automatically."
              icon={<Shield className="h-4 w-4" />}
            />
          </TenantMetricGrid>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <TenantSectionCard
              title="Change password"
              description="Rotate your password when credentials are shared, compromised, or due for routine maintenance."
              contentClassName="space-y-4"
            >
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      className="h-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword((current) => !current)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="h-11 pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        className="h-11 pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordMessage ? (
                  <Alert
                    variant={
                      passwordMessage.includes("successfully")
                        ? "default"
                        : "destructive"
                    }
                  >
                    {passwordMessage.includes("successfully") ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{passwordMessage}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={passwordSaving}
                    className="h-10"
                  >
                    {passwordSaving ? (
                      <LoadingButtonContent label="Updating password..." />
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </div>
              </form>
            </TenantSectionCard>

            <TenantSectionCard
              title="Security guidance"
              description="Operational guardrails for tenant administrators."
              contentClassName="space-y-3"
            >
              {[
                "Use a unique password for Univote only.",
                "Rotate credentials immediately after staff changes.",
                "Do not share tenant-admin access across departments.",
                "Review notifications and application updates regularly.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </TenantSectionCard>
          </div>
        </TabsContent>

        {isSuperAdmin ? (
          <TabsContent value="system" className="space-y-6">
            <TenantMetricGrid columns={4}>
              <TenantMetricCard
                label="System health"
                value={systemHealth?.status || "Unknown"}
                hint="Overall platform health across configured services."
                icon={<Server className="h-4 w-4" />}
              />
              <TenantMetricCard
                label="Students"
                value={databaseStats?.students.total?.toLocaleString() || "0"}
                hint={`${databaseStats?.students.active?.toLocaleString() || "0"} active`}
                icon={<User className="h-4 w-4" />}
              />
              <TenantMetricCard
                label="Votes"
                value={databaseStats?.votes.total?.toLocaleString() || "0"}
                hint="Total vote documents across the platform."
                icon={<Database className="h-4 w-4" />}
              />
              <TenantMetricCard
                label="Colleges"
                value={databaseStats?.colleges?.toLocaleString() || "0"}
                hint={`${databaseStats?.admins.total?.toLocaleString() || "0"} admins in the system`}
                icon={<Shield className="h-4 w-4" />}
              />
            </TenantMetricGrid>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <TenantSectionCard
                title="Service checks"
                description="Live readiness of the main subsystems backing authentication, email, recognition, and persistence."
                contentClassName="space-y-3"
              >
                {loading && !systemHealth ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  systemChecks.map(([key, check]) => {
                    const icon =
                      check.status === "healthy" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : check.status === "not_configured" ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      );

                    return (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{icon}</div>
                          <div>
                            <p className="text-sm font-semibold capitalize text-foreground">
                              {key}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {check.message}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {check.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </TenantSectionCard>

              <div className="space-y-6">
                <TenantSectionCard
                  title="Environment snapshot"
                  description="Configuration signals pulled from the settings service."
                  contentClassName="space-y-3"
                >
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <span className="text-sm text-muted-foreground">
                      Face verification
                    </span>
                    <Badge
                      variant={
                        systemConfig?.biometrics.configured
                          ? "default"
                          : "secondary"
                      }
                    >
                      {systemConfig?.biometrics.configured
                        ? "Configured"
                        : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <span className="text-sm text-muted-foreground">
                      Email delivery
                    </span>
                    <Badge
                      variant={
                        systemConfig?.email.configured ? "default" : "secondary"
                      }
                    >
                      {systemConfig?.email.configured
                        ? "Configured"
                        : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <span className="text-sm text-muted-foreground">
                      Environment
                    </span>
                    <Badge variant="outline">
                      {systemConfig?.other.environment || "Unknown"}
                    </Badge>
                  </div>
                </TenantSectionCard>

                <TenantSectionCard
                  title="Test email delivery"
                  description="Send a real message to verify SMTP wiring before operational notices go out."
                  contentClassName="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="test-email-address">Recipient email</Label>
                    <Input
                      id="test-email-address"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmailAddress}
                      onChange={(event) =>
                        setTestEmailAddress(event.target.value)
                      }
                      className="h-11"
                    />
                  </div>
                  {emailTestMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{emailTestMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Button
                    onClick={handleTestEmail}
                    disabled={emailTesting}
                    className="h-10"
                  >
                    {emailTesting ? (
                      <LoadingButtonContent label="Sending test email..." />
                    ) : (
                      "Send test email"
                    )}
                  </Button>
                </TenantSectionCard>
              </div>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
