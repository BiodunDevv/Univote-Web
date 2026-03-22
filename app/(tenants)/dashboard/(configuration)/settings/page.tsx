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
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tenantFetch } from "@/lib/tenant-fetch";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import {
  useAdminBiometricMetricsQuery,
  useTenantAuthPolicySettingsQuery,
  useTenantIdentitySettingsQuery,
  useTenantLabelSettingsQuery,
  useTenantProfileSettingsQuery,
  useUpdateBiometricThresholdMutation,
  useUpdateTenantAuthPolicySettingsMutation,
  useUpdateTenantIdentitySettingsMutation,
  useUpdateTenantLabelSettingsMutation,
  useUpdateTenantProfileSettingsMutation,
} from "@/lib/queries/admin";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

type ParticipantFieldPolicy = {
  key?: string;
  label?: string;
  enabled?: boolean;
  required?: boolean;
  show_in_profile?: boolean;
  show_in_filters?: boolean;
  allow_in_eligibility?: boolean;
};

type SettingsTab = "profile" | "security" | "system";
type ParticipantStructureTab = "identity" | "structure" | "media";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    admin,
    token,
    hasHydrated,
    updateAdmin,
    updateTenant,
    tenant,
    membership,
  } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const isSuperAdmin = admin?.role === "super_admin";
  const biometricMetricsQuery = useAdminBiometricMetricsQuery(
    {},
    { enabled: hasHydrated && Boolean(token) && !isSuperAdmin },
  );
  const tenantProfileQuery = useTenantProfileSettingsQuery({
    enabled: hasHydrated && Boolean(token) && !isSuperAdmin,
  });
  const tenantIdentityQuery = useTenantIdentitySettingsQuery({
    enabled: hasHydrated && Boolean(token) && !isSuperAdmin,
  });
  const tenantLabelsQuery = useTenantLabelSettingsQuery({
    enabled: hasHydrated && Boolean(token) && !isSuperAdmin,
  });
  const tenantAuthPolicyQuery = useTenantAuthPolicySettingsQuery({
    enabled: hasHydrated && Boolean(token) && !isSuperAdmin,
  });
  const updateBiometricThreshold = useUpdateBiometricThresholdMutation();
  const updateTenantProfileSettings = useUpdateTenantProfileSettingsMutation();
  const updateTenantIdentitySettings = useUpdateTenantIdentitySettingsMutation();
  const updateTenantLabelsSettings = useUpdateTenantLabelSettingsMutation();
  const updateTenantAuthPolicySettings =
    useUpdateTenantAuthPolicySettingsMutation();
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
  const [participantStructureTab, setParticipantStructureTab] =
    useState<ParticipantStructureTab>("structure");
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
  const [participantFields, setParticipantFields] = useState<
    Record<string, ParticipantFieldPolicy>
  >({});
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsMessage, setFieldsMessage] = useState("");
  const [biometricThreshold, setBiometricThreshold] = useState("80");
  const [biometricThresholdMessage, setBiometricThresholdMessage] =
    useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const lastProfileSyncKey = useRef<string | null>(null);
  const canManageTenantSettings = hasAnyTenantPermission(membership, [
    "tenant.settings.manage",
    "tenant.manage",
  ]);
  const canManageTenantIdentity = hasAnyTenantPermission(membership, [
    "tenant.identity.manage",
    "tenant.manage",
  ]);
  const canManageTenantLabels = hasAnyTenantPermission(membership, [
    "tenant.labels.manage",
    "tenant.manage",
  ]);
  const canManageTenantAuthPolicy = hasAnyTenantPermission(membership, [
    "tenant.auth-policy.manage",
    "tenant.manage",
  ]);
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantSupportEmail, setTenantSupportEmail] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState("");
  const [tenantPrimaryColor, setTenantPrimaryColor] = useState("");
  const [tenantAccentColor, setTenantAccentColor] = useState("");
  const [tenantContactName, setTenantContactName] = useState("");
  const [tenantContactEmail, setTenantContactEmail] = useState("");
  const [tenantContactPhone, setTenantContactPhone] = useState("");
  const [tenantProfileSaving, setTenantProfileSaving] = useState(false);
  const [tenantProfileMessage, setTenantProfileMessage] = useState("");
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const [labelsSaving, setLabelsSaving] = useState(false);
  const [labelsMessage, setLabelsMessage] = useState("");
  const [authPolicySaving, setAuthPolicySaving] = useState(false);
  const [authPolicyMessage, setAuthPolicyMessage] = useState("");
  const [participantSingular, setParticipantSingular] = useState("Student");
  const [participantPlural, setParticipantPlural] = useState("Students");
  const [primaryIdentifier, setPrimaryIdentifier] = useState("matric_no");
  const [displayIdentifier, setDisplayIdentifier] = useState("matric_no");
  const [allowedIdentifiers, setAllowedIdentifiers] = useState<string[]>([
    "matric_no",
  ]);
  const [recoveryIdentifiers, setRecoveryIdentifiers] = useState<string[]>([
    "matric_no",
  ]);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [requireFaceVerification, setRequireFaceVerification] =
    useState(false);
  const [allowParticipantTickets, setAllowParticipantTickets] =
    useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [votingRequireFaceVerification, setVotingRequireFaceVerification] =
    useState(false);

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
    if (!hasHydrated || !token || isSuperAdmin) {
      return;
    }

    let cancelled = false;
    const loadParticipantFields = async () => {
      setFieldsLoading(true);
      try {
        const response = await tenantFetch(
          `${API_BASE_URL}/api/admin/settings/participant-fields`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load participant fields");
        }
        if (!cancelled) {
          setParticipantFields(data.participant_fields || {});
        }
      } catch (loadError) {
        if (!cancelled) {
          setFieldsMessage(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load participant field policy.",
          );
        }
      } finally {
        if (!cancelled) {
          setFieldsLoading(false);
        }
      }
    };

    void loadParticipantFields();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, hasHydrated, isSuperAdmin, token]);

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
    const threshold = biometricMetricsQuery.data?.threshold;
    if (typeof threshold === "number") {
      setBiometricThreshold(String(threshold));
    }
  }, [biometricMetricsQuery.data?.threshold]);

  useEffect(() => {
    const tenantProfile = tenantProfileQuery.data?.tenant;
    if (!tenantProfile) return;

    setTenantName(tenantProfile.name || "");
    setTenantSlug(tenantProfile.slug || "");
    setTenantDomain(tenantProfile.primary_domain || "");
    setTenantSupportEmail(tenantProfile.branding?.support_email || "");
    setTenantLogoUrl(tenantProfile.branding?.logo_url || "");
    setTenantPrimaryColor(tenantProfile.branding?.primary_color || "");
    setTenantAccentColor(tenantProfile.branding?.accent_color || "");
    setTenantContactName(tenantProfile.onboarding?.contact_name || "");
    setTenantContactEmail(tenantProfile.onboarding?.contact_email || "");
    setTenantContactPhone(tenantProfile.onboarding?.contact_phone || "");
  }, [tenantProfileQuery.data?.tenant]);

  useEffect(() => {
    const labels = tenantLabelsQuery.data?.labels;
    if (!labels) return;
    setParticipantSingular(labels.participant_singular || "Student");
    setParticipantPlural(labels.participant_plural || "Students");
  }, [tenantLabelsQuery.data?.labels]);

  useEffect(() => {
    const identity = tenantIdentityQuery.data?.identity;
    if (!identity) return;
    setPrimaryIdentifier(identity.primary_identifier || "matric_no");
    setDisplayIdentifier(
      identity.display_identifier || identity.primary_identifier || "matric_no",
    );
    setAllowedIdentifiers(identity.allowed_identifiers || ["matric_no"]);
    setRecoveryIdentifiers(identity.recovery_identifiers || ["matric_no"]);
  }, [tenantIdentityQuery.data?.identity]);

  useEffect(() => {
    const authPolicy = tenantAuthPolicyQuery.data?.auth_policy;
    if (!authPolicy) return;
    setRequireEmail(Boolean(authPolicy.require_email));
    setRequirePhoto(Boolean(authPolicy.require_photo));
    setRequireFaceVerification(Boolean(authPolicy.require_face_verification));
    setAllowParticipantTickets(
      Boolean(tenantAuthPolicyQuery.data?.support?.allow_participant_tickets),
    );
    setEmailEnabled(Boolean(tenantAuthPolicyQuery.data?.notifications?.email_enabled));
    setInAppEnabled(Boolean(tenantAuthPolicyQuery.data?.notifications?.in_app_enabled));
    setPushEnabled(Boolean(tenantAuthPolicyQuery.data?.notifications?.push_enabled));
    setVotingRequireFaceVerification(
      Boolean(tenantAuthPolicyQuery.data?.voting?.require_face_verification),
    );
  }, [
    tenantAuthPolicyQuery.data?.auth_policy,
    tenantAuthPolicyQuery.data?.support,
    tenantAuthPolicyQuery.data?.notifications,
    tenantAuthPolicyQuery.data?.voting,
  ]);

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

  const handleBiometricThresholdSave = async () => {
    setBiometricThresholdMessage("");
    const nextThreshold = Number(biometricThreshold);

    if (Number.isNaN(nextThreshold) || nextThreshold < 0 || nextThreshold > 100) {
      setBiometricThresholdMessage(
        "Enter a threshold between 0 and 100.",
      );
      return;
    }

    try {
      const response = await updateBiometricThreshold.mutateAsync(nextThreshold);
      setBiometricThreshold(String(response.threshold));
      setBiometricThresholdMessage("Biometric threshold updated successfully.");
    } catch (error) {
      setBiometricThresholdMessage(
        error instanceof Error
          ? error.message
          : "Failed to update biometric threshold.",
      );
    }
  };

  const handleParticipantFieldToggle = (
    fieldKey: string,
    property: keyof ParticipantFieldPolicy,
    checked: boolean,
  ) => {
    setParticipantFields((current) => ({
      ...current,
      [fieldKey]: {
        ...current[fieldKey],
        [property]: checked,
      },
    }));
  };

  const saveParticipantFields = async () => {
    if (!token || isSuperAdmin) return;

    setFieldsSaving(true);
    setFieldsMessage("");

    try {
      const response = await tenantFetch(
        `${API_BASE_URL}/api/admin/settings/participant-fields`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participant_fields: participantFields,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save participant fields");
      }
      setParticipantFields(data.participant_fields || {});
      setFieldsMessage("Participant field policy updated successfully.");
    } catch (saveError) {
      setFieldsMessage(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update participant field policy.",
      );
    } finally {
      setFieldsSaving(false);
    }
  };

  const roleLabel =
    profile?.role === "super_admin" || admin.role === "super_admin"
      ? "Super Admin"
      : "Tenant Admin";
  const profileEmail = profile?.email || admin.email;
  const profileName = profile?.full_name || admin.full_name;
  const identityChoices =
    tenantIdentityQuery.data?.catalog &&
    typeof tenantIdentityQuery.data.catalog === "object"
      ? Object.entries(tenantIdentityQuery.data.catalog).map(([key, value]) => ({
          key,
          label:
            typeof value === "object" &&
            value &&
            "label" in value &&
            typeof value.label === "string"
              ? value.label
              : key,
        }))
      : [
          { key: "matric_no", label: "Matric number" },
          { key: "email", label: "Email" },
          { key: "member_id", label: "Member ID" },
          { key: "employee_id", label: "Employee ID" },
          { key: "username", label: "Username" },
        ];

  const toggleIdentifierSelection = (
    currentValues: string[],
    nextValue: string,
    setValues: (values: string[]) => void,
  ) => {
    if (currentValues.includes(nextValue)) {
      setValues(currentValues.filter((value) => value !== nextValue));
      return;
    }
    setValues([...currentValues, nextValue]);
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
        logo_url: tenantLogoUrl || null,
        primary_color: tenantPrimaryColor || null,
        accent_color: tenantAccentColor || null,
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

  const handleIdentitySave = async () => {
    setIdentityMessage("");
    setIdentitySaving(true);

    try {
      await updateTenantIdentitySettings.mutateAsync({
        primary_identifier: primaryIdentifier,
        display_identifier: displayIdentifier,
        allowed_identifiers: allowedIdentifiers,
        recovery_identifiers: recoveryIdentifiers,
      });
      setIdentityMessage("Identity policy updated successfully.");
    } catch (saveError) {
      setIdentityMessage(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update identity policy.",
      );
    } finally {
      setIdentitySaving(false);
    }
  };

  const handleLabelsSave = async () => {
    setLabelsMessage("");
    setLabelsSaving(true);

    try {
      const response = await updateTenantLabelsSettings.mutateAsync({
        participant_singular: participantSingular,
        participant_plural: participantPlural,
      });
      updateTenant({
        labels: response.labels,
      });
      setLabelsMessage("Participant terminology updated successfully.");
    } catch (saveError) {
      setLabelsMessage(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update participant terminology.",
      );
    } finally {
      setLabelsSaving(false);
    }
  };

  const handleAuthPolicySave = async () => {
    setAuthPolicyMessage("");
    setAuthPolicySaving(true);

    try {
      const response = await updateTenantAuthPolicySettings.mutateAsync({
        require_email: requireEmail,
        require_photo: requirePhoto,
        require_face_verification: requireFaceVerification,
        allow_participant_tickets: allowParticipantTickets,
        email_enabled: emailEnabled,
        in_app_enabled: inAppEnabled,
        push_enabled: pushEnabled,
        voting_require_face_verification: votingRequireFaceVerification,
      });
      updateTenant({
        auth_policy: response.auth_policy,
      });
      setAuthPolicyMessage(
        "Authentication and communication policy updated successfully.",
      );
    } catch (saveError) {
      setAuthPolicyMessage(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update policy settings.",
      );
    } finally {
      setAuthPolicySaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant settings"
        icon={<Shield className="h-5 w-5" />}
        title="Settings"
        subtitle="Manage your administrator account, university workspace profile, identity rules, and operational security from one responsive settings surface."
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
                  <div className="lg:col-span-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="h-10"
                    >
                      {profileSaving ? "Saving..." : "Save profile changes"}
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
                description="Update the university name, slug, contact details, and branding fields used across the workspace."
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
                  <div className="space-y-2">
                    <Label htmlFor="tenant-logo-url">Logo URL</Label>
                    <Input
                      id="tenant-logo-url"
                      value={tenantLogoUrl}
                      onChange={(event) => setTenantLogoUrl(event.target.value)}
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-primary-color">Primary color</Label>
                    <Input
                      id="tenant-primary-color"
                      value={tenantPrimaryColor}
                      onChange={(event) =>
                        setTenantPrimaryColor(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                      placeholder="#1d4ed8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-accent-color">Accent color</Label>
                    <Input
                      id="tenant-accent-color"
                      value={tenantAccentColor}
                      onChange={(event) =>
                        setTenantAccentColor(event.target.value)
                      }
                      disabled={!canManageTenantSettings || tenantProfileSaving}
                      className="h-11"
                      placeholder="#0f172a"
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
                    {tenantProfileQuery.data?.tenant?.name || tenant?.name || "University workspace"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tenantProfileQuery.data?.tenant?.slug || tenant?.slug || "No slug"}
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
                    {passwordSaving ? "Updating..." : "Update password"}
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

          {!isSuperAdmin ? (
            <>
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <TenantSectionCard
                  title="Identity policy"
                  description="Control the identifier students use to sign in and recover access."
                  contentClassName="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Primary identifier</Label>
                      <Select
                        value={primaryIdentifier}
                        onValueChange={setPrimaryIdentifier}
                        disabled={!canManageTenantIdentity || identitySaving}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select identifier" />
                        </SelectTrigger>
                        <SelectContent>
                          {identityChoices.map((choice) => (
                            <SelectItem key={choice.key} value={choice.key}>
                              {choice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Display identifier</Label>
                      <Select
                        value={displayIdentifier}
                        onValueChange={setDisplayIdentifier}
                        disabled={!canManageTenantIdentity || identitySaving}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select identifier" />
                        </SelectTrigger>
                        <SelectContent>
                          {identityChoices.map((choice) => (
                            <SelectItem key={choice.key} value={choice.key}>
                              {choice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Allowed sign-in identifiers</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {identityChoices.map((choice) => (
                        <label
                          key={`allowed-${choice.key}`}
                          className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                        >
                          <span className="text-sm">{choice.label}</span>
                          <Switch
                            checked={allowedIdentifiers.includes(choice.key)}
                            onCheckedChange={() =>
                              toggleIdentifierSelection(
                                allowedIdentifiers,
                                choice.key,
                                setAllowedIdentifiers,
                              )
                            }
                            disabled={!canManageTenantIdentity || identitySaving}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Recovery identifiers</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {identityChoices.map((choice) => (
                        <label
                          key={`recovery-${choice.key}`}
                          className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                        >
                          <span className="text-sm">{choice.label}</span>
                          <Switch
                            checked={recoveryIdentifiers.includes(choice.key)}
                            onCheckedChange={() =>
                              toggleIdentifierSelection(
                                recoveryIdentifiers,
                                choice.key,
                                setRecoveryIdentifiers,
                              )
                            }
                            disabled={!canManageTenantIdentity || identitySaving}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  {identityMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{identityMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleIdentitySave()}
                      disabled={!canManageTenantIdentity || identitySaving}
                    >
                      {identitySaving ? "Saving..." : "Save identity policy"}
                    </Button>
                  </div>
                </TenantSectionCard>

                <TenantSectionCard
                  title="Terminology and access policy"
                  description="Define how the workspace refers to students and how profile/media requirements behave."
                  contentClassName="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="participant-singular">
                        Participant singular
                      </Label>
                      <Input
                        id="participant-singular"
                        value={participantSingular}
                        onChange={(event) =>
                          setParticipantSingular(event.target.value)
                        }
                        disabled={!canManageTenantLabels || labelsSaving}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="participant-plural">
                        Participant plural
                      </Label>
                      <Input
                        id="participant-plural"
                        value={participantPlural}
                        onChange={(event) =>
                          setParticipantPlural(event.target.value)
                        }
                        disabled={!canManageTenantLabels || labelsSaving}
                        className="h-11"
                      />
                    </div>
                  </div>
                  {labelsMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{labelsMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleLabelsSave()}
                      disabled={!canManageTenantLabels || labelsSaving}
                    >
                      {labelsSaving ? "Saving..." : "Save terminology"}
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {[
                      {
                        label: "Require email",
                        checked: requireEmail,
                        setChecked: setRequireEmail,
                      },
                      {
                        label: "Require photo",
                        checked: requirePhoto,
                        setChecked: setRequirePhoto,
                      },
                      {
                        label: "Require face verification",
                        checked: requireFaceVerification,
                        setChecked: setRequireFaceVerification,
                      },
                      {
                        label: "Allow student support tickets",
                        checked: allowParticipantTickets,
                        setChecked: setAllowParticipantTickets,
                      },
                      {
                        label: "Email notifications",
                        checked: emailEnabled,
                        setChecked: setEmailEnabled,
                      },
                      {
                        label: "In-app notifications",
                        checked: inAppEnabled,
                        setChecked: setInAppEnabled,
                      },
                      {
                        label: "Push notifications",
                        checked: pushEnabled,
                        setChecked: setPushEnabled,
                      },
                      {
                        label: "Require face verification for voting",
                        checked: votingRequireFaceVerification,
                        setChecked: setVotingRequireFaceVerification,
                      },
                    ].map((item) => (
                      <label
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                      >
                        <span className="text-sm">{item.label}</span>
                        <Switch
                          checked={item.checked}
                          onCheckedChange={item.setChecked}
                          disabled={
                            !canManageTenantAuthPolicy || authPolicySaving
                          }
                        />
                      </label>
                    ))}
                  </div>
                  {authPolicyMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{authPolicyMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleAuthPolicySave()}
                      disabled={
                        !canManageTenantAuthPolicy || authPolicySaving
                      }
                    >
                      {authPolicySaving ? "Saving..." : "Save policy settings"}
                    </Button>
                  </div>
                </TenantSectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <TenantSectionCard
                  title="Biometric threshold"
                  description="Adjust the Face++ match threshold used for vote-time verification in this university workspace."
                  contentClassName="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-biometric-threshold">
                        Face match threshold
                      </Label>
                      <Input
                        id="tenant-biometric-threshold"
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={biometricThreshold}
                        onChange={(event) =>
                          setBiometricThreshold(event.target.value)
                        }
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Accuracy{" "}
                        {`${((biometricMetricsQuery.data?.metrics.summary.accuracy || 0) * 100).toFixed(1)}%`}
                        {" • "}Pending reviews{" "}
                        {biometricMetricsQuery.data?.metrics.summary.unlabeled_attempts || 0}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleBiometricThresholdSave}
                      disabled={updateBiometricThreshold.isPending}
                      className="h-11"
                    >
                      {updateBiometricThreshold.isPending
                        ? "Saving..."
                        : "Save threshold"}
                    </Button>
                  </div>
                  {biometricThresholdMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {biometricThresholdMessage}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </TenantSectionCard>

                <TenantSectionCard
                  title="Participant structure policy"
                  description="Control which student profile fields and eligibility dimensions stay active across the university."
                  contentClassName="space-y-4"
                >
                  {fieldsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {Object.entries(participantFields).map(([fieldKey, field]) => (
                          <div
                            key={fieldKey}
                            className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {field.label || field.key || fieldKey}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Field key: {fieldKey}
                                </p>
                              </div>
                              <Switch
                                checked={Boolean(field.enabled)}
                                onCheckedChange={(checked) =>
                                  handleParticipantFieldToggle(
                                    fieldKey,
                                    "enabled",
                                    checked,
                                  )
                                }
                                disabled={!canManageTenantSettings || fieldsSaving}
                              />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {[
                                {
                                  key: "required" as const,
                                  label: "Required",
                                },
                                {
                                  key: "show_in_profile" as const,
                                  label: "Show in profile",
                                },
                                {
                                  key: "show_in_filters" as const,
                                  label: "Show in filters",
                                },
                              ].map((toggle) => (
                                <label
                                  key={toggle.key}
                                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2"
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {toggle.label}
                                  </span>
                                  <Switch
                                    checked={Boolean(field[toggle.key])}
                                    onCheckedChange={(checked) =>
                                      handleParticipantFieldToggle(
                                        fieldKey,
                                        toggle.key,
                                        checked,
                                      )
                                    }
                                    disabled={
                                      !canManageTenantSettings || fieldsSaving
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {fieldsMessage ? (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>{fieldsMessage}</AlertDescription>
                        </Alert>
                      ) : null}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => void saveParticipantFields()}
                          disabled={!canManageTenantSettings || fieldsSaving}
                        >
                          {fieldsSaving ? "Saving..." : "Save field policy"}
                        </Button>
                      </div>
                    </>
                  )}
                </TenantSectionCard>
              </div>
            </>
          ) : null}
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
                label={participantLabels.plural}
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
                  title="Biometric threshold"
                  description="Adjust the Face++ match threshold used for student vote verification in this university workspace."
                  contentClassName="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="biometric-threshold">
                        Face match threshold
                      </Label>
                      <Input
                        id="biometric-threshold"
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={biometricThreshold}
                        onChange={(event) =>
                          setBiometricThreshold(event.target.value)
                        }
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Current reviewed accuracy:{" "}
                        {`${(((biometricMetricsQuery.data?.metrics.summary.accuracy || 0) * 100)).toFixed(1)}%`}
                        {" • "}Pending reviews:{" "}
                        {biometricMetricsQuery.data?.metrics.summary.unlabeled_attempts || 0}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleBiometricThresholdSave}
                      disabled={updateBiometricThreshold.isPending}
                      className="h-11"
                    >
                      {updateBiometricThreshold.isPending
                        ? "Saving..."
                        : "Save threshold"}
                    </Button>
                  </div>
                  {biometricThresholdMessage ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {biometricThresholdMessage}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </TenantSectionCard>

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
                        systemConfig?.facepp.configured
                          ? "default"
                          : "secondary"
                      }
                    >
                      {systemConfig?.facepp.configured
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
                    {emailTesting ? "Sending..." : "Send test email"}
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
