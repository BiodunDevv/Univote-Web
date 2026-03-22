"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Layers3,
  LifeBuoy,
  Plus,
  Rocket,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  useCreatePlatformBiometricProviderMutation,
  useDeletePlatformBiometricProviderMutation,
  usePlatformOverviewQuery,
  usePlatformSettingsQuery,
  useTestPlatformBiometricsMutation,
  useUpdatePlatformSettingsMutation,
  usePlatformTenantsQuery,
} from "@/lib/queries/platform";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const workspaceLinks = [
  {
    href: "/super-admin/onboarding",
    label: "Application verification",
    description:
      "Review university onboarding status, moderation notes, and activation progress.",
    icon: Rocket,
  },
  {
    href: "/super-admin/testimonials",
    label: "Testimonials",
    description:
      "Moderate marketing proof points and publish approved stories.",
    icon: Layers3,
  },
  {
    href: "/super-admin/notifications",
    label: "Notifications",
    description:
      "Track system notices, support escalation, and tenant lifecycle alerts.",
    icon: Bell,
  },
  {
    href: "/super-admin/system-health",
    label: "System health",
    description:
      "Inspect health metrics, infra posture, and platform readiness.",
    icon: ShieldCheck,
  },
  {
    href: "/super-admin/audit-logs",
    label: "Audit logs",
    description:
      "Inspect privileged actions across tenants and platform operations.",
    icon: FileText,
  },
  {
    href: "/super-admin/biometrics",
    label: "Biometric monitoring",
    description:
      "Inspect FAR, FRR, accuracy, and verification review posture across universities.",
    icon: ShieldCheck,
  },
];

export default function PlatformSettingsPage() {
  const { token, admin, updateAdmin } = useAuthStore();
  const {
    profile,
    loading: settingsLoading,
    getProfile,
    updateProfile,
    changePassword,
  } = useSettingsStore();
  const overviewQuery = usePlatformOverviewQuery();
  const onboardingQuery = usePlatformTenantsQuery({
    status: "pending_approval",
    limit: 1,
  });

  const overview = overviewQuery.data?.overview;
  const settingsQuery = usePlatformSettingsQuery();
  const updateSettings = useUpdatePlatformSettingsMutation();
  const createBiometricProvider = useCreatePlatformBiometricProviderMutation();
  const deleteBiometricProvider = useDeletePlatformBiometricProviderMutation();
  const testBiometrics = useTestPlatformBiometricsMutation();
  const biometrics = settingsQuery.data?.biometrics;
  const facepp = settingsQuery.data?.biometrics.providers.facepp;
  const awsRekognition =
    settingsQuery.data?.biometrics.providers.aws_rekognition;
  const azureFace = settingsQuery.data?.biometrics.providers.azure_face;
  const googleVision = settingsQuery.data?.biometrics.providers.google_vision;
  const [activeProvider, setActiveProvider] = useState("facepp");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState(
    "https://api-us.faceplusplus.com/facepp/v3",
  );
  const [threshold, setThreshold] = useState("80");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsThreshold, setAwsThreshold] = useState("90");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [azureApiKey, setAzureApiKey] = useState("");
  const [azureThreshold, setAzureThreshold] = useState("80");
  const [googleProjectId, setGoogleProjectId] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleThreshold, setGoogleThreshold] = useState("80");
  const [testImageUrl, setTestImageUrl] = useState(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [providerAction, setProviderAction] = useState<{
    providerKey: string;
    action: "create" | "delete" | "save" | "test";
  } | null>(null);
  const [configProviderOpen, setConfigProviderOpen] = useState(false);
  const [lastBiometricTest, setLastBiometricTest] = useState<{
    provider: string;
    summary?: Record<string, unknown>;
    provider_status?: Record<string, unknown>;
    result?: Record<string, unknown>;
    provider_response?: Record<string, unknown>;
  } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const lastProfileSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (!biometrics || !facepp) return;
    setActiveProvider(biometrics.active_provider || "facepp");
    setApiKey(facepp.api_key_value || "");
    setApiSecret(facepp.api_secret_value || "");
    setBaseUrl(facepp.base_url || "https://api-us.faceplusplus.com/facepp/v3");
    setThreshold(String(facepp.confidence_threshold || 80));
    setAwsRegion(awsRekognition?.region || "us-east-1");
    setAwsAccessKeyId(awsRekognition?.access_key_id_value || "");
    setAwsSecretAccessKey(awsRekognition?.secret_access_key_value || "");
    setAwsThreshold(String(awsRekognition?.similarity_threshold || 90));
    setAzureEndpoint(azureFace?.endpoint || "");
    setAzureApiKey(azureFace?.api_key_value || "");
    setAzureThreshold(String(azureFace?.confidence_threshold || 80));
    setGoogleProjectId(googleVision?.project_id || "");
    setGoogleApiKey(googleVision?.api_key_value || "");
    setGoogleThreshold(String(googleVision?.confidence_threshold || 80));
  }, [biometrics, facepp, awsRekognition, azureFace, googleVision]);

  useEffect(() => {
    if (!token) return;
    void getProfile(token).catch(() => undefined);
  }, [getProfile, token]);

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

  const providerCatalog = biometrics?.provider_catalog || {};
  const providerEntries = Object.entries(providerCatalog);
  const providerRecords = (biometrics?.providers || {}) as Record<
    string,
    Record<string, unknown>
  >;
  const activeProviderSettings = providerRecords[activeProvider] || {};
  const isProviderActionActive = (
    providerKey: string,
    actions?: Array<"create" | "delete" | "save" | "test">,
  ) =>
    Boolean(
      providerAction &&
        providerAction.providerKey === providerKey &&
        (!actions || actions.includes(providerAction.action)),
    );

  useEffect(() => {
    if (providerEntries.length === 0) return;
    const hasVisibleActiveProvider = providerEntries.some(
      ([providerKey]) => providerKey === activeProvider,
    );
    if (!hasVisibleActiveProvider) {
      setActiveProvider(providerEntries[0][0] || "facepp");
    }
  }, [activeProvider, providerEntries]);

  const buildProviderPayload = (providerKey: string) => {
    switch (providerKey) {
      case "facepp":
        return {
          api_key: apiKey || undefined,
          api_secret: apiSecret || undefined,
          base_url: baseUrl,
          confidence_threshold: Number(threshold || 80),
          enabled: true,
        };
      case "aws_rekognition":
        return {
          access_key_id: awsAccessKeyId || undefined,
          secret_access_key: awsSecretAccessKey || undefined,
          region: awsRegion,
          similarity_threshold: Number(awsThreshold || 90),
          enabled: true,
        };
      case "azure_face":
        return {
          endpoint: azureEndpoint || undefined,
          api_key: azureApiKey || undefined,
          confidence_threshold: Number(azureThreshold || 80),
          enabled: true,
        };
      case "google_vision":
        return {
          project_id: googleProjectId || undefined,
          api_key: googleApiKey || undefined,
          confidence_threshold: Number(googleThreshold || 80),
          enabled: true,
        };
      default:
        return { enabled: true };
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setProfileSaving(true);
    try {
      const updatedProfile = await updateProfile(token, {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
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
      toast.success("Profile updated", {
        description: "Your super-admin account details are now up to date.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      setProfileMessage(message);
      toast.error("Unable to update profile", { description: message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setSecurityMessage("New password and confirmation do not match.");
      toast.error("Password confirmation mismatch");
      return;
    }
    setSecuritySaving(true);
    try {
      await changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityMessage("Password changed successfully.");
      toast.success("Password updated", {
        description: "Your super-admin credentials were updated successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to change password";
      setSecurityMessage(message);
      toast.error("Unable to change password", { description: message });
    } finally {
      setSecuritySaving(false);
    }
  };

  const openProviderConfiguration = (providerKey: string) => {
    setActiveProvider(providerKey);
    setConfigProviderOpen(true);
  };

  const handleSaveBiometrics = async () => {
    setProviderAction({ providerKey: activeProvider, action: "save" });
    try {
      const result = await updateSettings.mutateAsync({
        biometrics: {
          active_provider: activeProvider,
          providers: {
            facepp: {
              api_key: apiKey || undefined,
              api_secret: apiSecret || undefined,
              base_url: baseUrl,
              confidence_threshold: Number(threshold || 80),
              enabled: Boolean(facepp?.enabled),
            },
            aws_rekognition: {
              access_key_id: awsAccessKeyId || undefined,
              secret_access_key: awsSecretAccessKey || undefined,
              region: awsRegion,
              similarity_threshold: Number(awsThreshold || 90),
              enabled: Boolean(awsRekognition?.enabled),
            },
            azure_face: {
              endpoint: azureEndpoint || undefined,
              api_key: azureApiKey || undefined,
              confidence_threshold: Number(azureThreshold || 80),
              enabled: Boolean(azureFace?.enabled),
            },
            google_vision: {
              project_id: googleProjectId || undefined,
              api_key: googleApiKey || undefined,
              confidence_threshold: Number(googleThreshold || 80),
              enabled: Boolean(googleVision?.enabled),
            },
          },
        },
      });
      toast.success(result.message || "Biometric settings updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update biometric settings",
      );
    } finally {
      setProviderAction((current) =>
        current?.providerKey === activeProvider && current.action === "save"
          ? null
          : current,
      );
    }
  };

  const handleCreateProvider = async (providerKey: string) => {
    setProviderAction({ providerKey, action: "create" });
    try {
      const result = await createBiometricProvider.mutateAsync({
        provider_key: providerKey,
        config: buildProviderPayload(providerKey),
        set_active: activeProvider === providerKey,
      });
      setActiveProvider(providerKey);
      toast.success(result.message || "Biometric provider created");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create biometric provider",
      );
    } finally {
      setProviderAction((current) =>
        current?.providerKey === providerKey && current.action === "create"
          ? null
          : current,
      );
    }
  };

  const handleDeleteProvider = async (providerKey: string) => {
    setProviderAction({ providerKey, action: "delete" });
    try {
      const result = await deleteBiometricProvider.mutateAsync(providerKey);
      if (activeProvider === providerKey) {
        setActiveProvider("facepp");
      }
      if (providerKey === activeProvider) {
        setConfigProviderOpen(false);
      }
      toast.success(result.message || "Biometric provider removed");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove biometric provider",
      );
    } finally {
      setProviderAction((current) =>
        current?.providerKey === providerKey && current.action === "delete"
          ? null
          : current,
      );
    }
  };

  const handleTestProvider = async () => {
    setProviderAction({ providerKey: activeProvider, action: "test" });
    try {
      const result = await testBiometrics.mutateAsync({
        imageUrl: testImageUrl,
        providerKey: activeProvider,
      });
      setLastBiometricTest(result);
      toast.success(`Provider test succeeded with ${result.provider}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Provider test failed",
      );
    } finally {
      setProviderAction((current) =>
        current?.providerKey === activeProvider && current.action === "test"
          ? null
          : current,
      );
    }
  };

  const activeProviderLabel =
    providerCatalog[activeProvider]?.label || activeProvider;

  return (
    <div className="space-y-3">
      <section className="rounded-4xl border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold sm:text-xl">
            Platform Settings
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Use this workspace as the operating hub for platform-wide controls,
            tenant lifecycle supervision, and operational follow-up. Critical
            actions still live in their dedicated pages, but this gives super
            admins one clean control surface.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Active tenants</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {overview ? overview.active_tenants : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Institutions currently provisioned and running on the platform.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Total tenants</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {overview ? overview.total_tenants : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total institutions provisioned on the Univote platform.
            </p>
          </CardContent>
        </Card>
        <Card id="profile" className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Pending approval</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {onboardingQuery.data ? onboardingQuery.data.total : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Universities that have completed onboarding and are waiting on platform
              activation review.
            </p>
          </CardContent>
        </Card>
        <Card id="security" className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Suspended tenants</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {overview ? overview.suspended_tenants : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Institutions currently suspended from platform access.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your super-admin identity, contact email, and the account
              details used across platform operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="super-admin-name">Full name</Label>
                <Input
                  id="super-admin-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="super-admin-email">Email</Label>
                <Input
                  id="super-admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {profile?.role || admin?.role || "super_admin"}
              </p>
              <p className="mt-1">
                Changes here update the identity shown in platform
                notifications, audit logs, announcements, and administrative
                activity.
              </p>
            </div>
            {profileMessage ? (
              <Alert>
                <AlertDescription>{profileMessage}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              onClick={() => void handleSaveProfile()}
              disabled={profileSaving}
            >
              {profileSaving ? (
                <LoadingButtonContent label="Saving profile..." />
              ) : (
                "Save profile changes"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Rotate your password without leaving the platform settings
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="super-admin-current-password">
                Current password
              </Label>
              <Input
                id="super-admin-current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="super-admin-new-password">New password</Label>
                <Input
                  id="super-admin-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="super-admin-confirm-password">
                  Confirm new password
                </Label>
                <Input
                  id="super-admin-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            {securityMessage ? (
              <Alert>
                <AlertDescription>{securityMessage}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              variant="outline"
              onClick={() => void handleChangePassword()}
              disabled={securitySaving}
            >
              {securitySaving ? (
                <LoadingButtonContent label="Updating password..." />
              ) : (
                "Change password"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Biometric provider</CardTitle>
          <CardDescription>
            Create, configure, activate, test, and retire biometric providers
            from one managed catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="catalog">Provider Catalog</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="mt-4">
              <div className="grid gap-3 lg:grid-cols-2">
                {providerEntries.map(([providerKey, catalog]) => {
                  const settings = providerRecords[providerKey] || {};
                  const isConfigured = Boolean(settings.configured);
                  const isEnabled = Boolean(settings.enabled);
                  const isActive = biometrics?.active_provider === providerKey;

                  return (
                    <div
                      key={providerKey}
                      className="rounded-2xl border border-border/70 bg-card/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {catalog.label}
                            </p>
                            {isActive ? <Badge>Active</Badge> : null}
                            <Badge variant="outline">
                              {catalog.implemented
                                ? "Implemented"
                                : "Catalog only"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {catalog.description ||
                              "Managed biometric provider option."}
                          </p>
                        </div>
                        {isConfigured ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Required setup
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(catalog.requirements || []).map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                        Add this provider slot to the platform catalog now, then
                        complete its credentials and testing before making it
                        active for tenant workflows.
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={isEnabled ? "outline" : "default"}
                          onClick={() => void handleCreateProvider(providerKey)}
                          disabled={isProviderActionActive(providerKey)}
                        >
                          {providerAction?.providerKey === providerKey &&
                          providerAction.action === "create" ? (
                            <LoadingButtonContent
                              label={isEnabled ? "Updating..." : "Creating..."}
                            />
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              {isEnabled
                                ? "Re-save provider"
                                : "Create provider"}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProviderConfiguration(providerKey)}
                        >
                          Edit configuration
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => void handleDeleteProvider(providerKey)}
                          disabled={
                            !isEnabled || isProviderActionActive(providerKey)
                          }
                        >
                          {providerAction?.providerKey === providerKey &&
                          providerAction.action === "delete" ? (
                            <LoadingButtonContent label="Removing..." />
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="mt-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="active-provider">Active provider</Label>
                      <Select
                        value={activeProvider}
                        onValueChange={setActiveProvider}
                      >
                        <SelectTrigger id="active-provider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providerEntries.map(([providerKey, catalog]) => (
                            <SelectItem key={providerKey} value={providerKey}>
                              {catalog.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {providerCatalog[activeProvider]?.label || activeProvider}
                    </Badge>
                    <Badge variant="outline">
                      {providerCatalog[activeProvider]?.implemented
                        ? "Implemented"
                        : "Configuration ready"}
                    </Badge>
                    <Badge variant="outline">
                      {activeProviderSettings.configured
                        ? "Configured"
                        : "Not configured"}
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <p className="text-sm font-semibold">
                      {activeProviderLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {providerCatalog[activeProvider]?.description ||
                        "Configure this provider with the required credentials and thresholds."}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Configure the active provider here, or switch to another
                      provider slot before saving.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {activeProvider === "facepp" ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="facepp-api-key">API key</Label>
                            <Input
                              id="facepp-api-key"
                              value={apiKey}
                              onChange={(event) =>
                                setApiKey(event.target.value)
                              }
                              placeholder={
                                facepp?.api_key_masked || "Paste Face++ API key"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="facepp-api-secret">
                              API secret
                            </Label>
                            <Input
                              id="facepp-api-secret"
                              value={apiSecret}
                              onChange={(event) =>
                                setApiSecret(event.target.value)
                              }
                              placeholder={
                                facepp?.api_secret_masked ||
                                "Paste Face++ API secret"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="facepp-base-url">Base URL</Label>
                            <Input
                              id="facepp-base-url"
                              value={baseUrl}
                              onChange={(event) =>
                                setBaseUrl(event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="facepp-threshold">
                              Confidence threshold
                            </Label>
                            <Input
                              id="facepp-threshold"
                              type="number"
                              min="1"
                              max="100"
                              value={threshold}
                              onChange={(event) =>
                                setThreshold(event.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : null}

                      {activeProvider === "aws_rekognition" ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="aws-region">Region</Label>
                            <Input
                              id="aws-region"
                              value={awsRegion}
                              onChange={(event) =>
                                setAwsRegion(event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="aws-access-key">Access key</Label>
                            <Input
                              id="aws-access-key"
                              value={awsAccessKeyId}
                              onChange={(event) =>
                                setAwsAccessKeyId(event.target.value)
                              }
                              placeholder={
                                awsRekognition?.access_key_id_masked ||
                                "Paste AWS access key"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="aws-secret">Secret key</Label>
                            <Input
                              id="aws-secret"
                              value={awsSecretAccessKey}
                              onChange={(event) =>
                                setAwsSecretAccessKey(event.target.value)
                              }
                              placeholder={
                                awsRekognition?.secret_access_key_masked ||
                                "Paste AWS secret key"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="aws-threshold">
                              Similarity threshold
                            </Label>
                            <Input
                              id="aws-threshold"
                              type="number"
                              min="1"
                              max="100"
                              value={awsThreshold}
                              onChange={(event) =>
                                setAwsThreshold(event.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : null}

                      {activeProvider === "azure_face" ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="azure-endpoint">Endpoint</Label>
                            <Input
                              id="azure-endpoint"
                              value={azureEndpoint}
                              onChange={(event) =>
                                setAzureEndpoint(event.target.value)
                              }
                              placeholder={azureFace?.endpoint || "https://..."}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="azure-api-key">API key</Label>
                            <Input
                              id="azure-api-key"
                              value={azureApiKey}
                              onChange={(event) =>
                                setAzureApiKey(event.target.value)
                              }
                              placeholder={
                                azureFace?.api_key_masked ||
                                "Paste Azure API key"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="azure-threshold">
                              Confidence threshold
                            </Label>
                            <Input
                              id="azure-threshold"
                              type="number"
                              min="1"
                              max="100"
                              value={azureThreshold}
                              onChange={(event) =>
                                setAzureThreshold(event.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : null}

                      {activeProvider === "google_vision" ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="google-project-id">
                              Project ID
                            </Label>
                            <Input
                              id="google-project-id"
                              value={googleProjectId}
                              onChange={(event) =>
                                setGoogleProjectId(event.target.value)
                              }
                              placeholder={
                                googleVision?.project_id || "project-id"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="google-api-key">API key</Label>
                            <Input
                              id="google-api-key"
                              value={googleApiKey}
                              onChange={(event) =>
                                setGoogleApiKey(event.target.value)
                              }
                              placeholder={
                                googleVision?.api_key_masked ||
                                "Paste Google API key"
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="google-threshold">
                              Confidence threshold
                            </Label>
                            <Input
                              id="google-threshold"
                              type="number"
                              min="1"
                              max="100"
                              value={googleThreshold}
                              onChange={(event) =>
                                setGoogleThreshold(event.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Setup checklist</p>
                    <p className="text-sm text-muted-foreground">
                      Add the credentials below before activating this provider
                      for tenant workflows.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(providerCatalog[activeProvider]?.requirements || []).map(
                      (item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ),
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => void handleSaveBiometrics()}
                    disabled={isProviderActionActive(activeProvider)}
                  >
                    {providerAction?.providerKey === activeProvider &&
                    providerAction.action === "save" ? (
                      <LoadingButtonContent label="Saving provider settings..." />
                    ) : (
                      "Save provider configuration"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void handleCreateProvider(activeProvider)}
                    disabled={isProviderActionActive(activeProvider)}
                  >
                    {providerAction?.providerKey === activeProvider &&
                    providerAction.action === "create" ? (
                      <LoadingButtonContent
                        label={
                          Boolean(activeProviderSettings.enabled)
                            ? "Re-saving provider..."
                            : "Creating provider..."
                        }
                      />
                    ) : Boolean(activeProviderSettings.enabled) ? (
                      "Re-save provider"
                    ) : (
                      "Create or enable provider"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive"
                    onClick={() => void handleDeleteProvider(activeProvider)}
                    disabled={
                      isProviderActionActive(activeProvider) ||
                      !Boolean(activeProviderSettings.enabled)
                    }
                  >
                    {providerAction?.providerKey === activeProvider &&
                    providerAction.action === "delete" ? (
                      <LoadingButtonContent label="Removing provider..." />
                    ) : (
                      "Delete provider"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="mt-4">
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="provider-test-image">Test image URL</Label>
                    <Input
                      id="provider-test-image"
                      value={testImageUrl}
                      onChange={(event) => setTestImageUrl(event.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run a live readiness check for{" "}
                    {providerCatalog[activeProvider]?.label || activeProvider}{" "}
                    and inspect the structured response before relying on
                    production verification.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => void handleTestProvider()}
                    disabled={isProviderActionActive(activeProvider)}
                    className="w-full"
                  >
                    {providerAction?.providerKey === activeProvider &&
                    providerAction.action === "test" ? (
                      <LoadingButtonContent label="Testing provider..." />
                    ) : (
                      "Run provider test"
                    )}
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Professional test response
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Readiness, provider status, and the latest structured
                      response are shown here after each test.
                    </p>
                  </div>

                  {lastBiometricTest ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Provider
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {lastBiometricTest.provider}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Detection
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {String(
                              lastBiometricTest.summary?.detection ||
                                "Completed",
                            )}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Image
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold">
                            {String(
                              lastBiometricTest.summary?.image_checked ||
                                testImageUrl,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Provider status
                          </p>
                          <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                            {JSON.stringify(
                              lastBiometricTest.provider_status || {},
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Provider response
                          </p>
                          <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                            {JSON.stringify(
                              lastBiometricTest.provider_response || {},
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Detection payload
                        </p>
                        <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                          {JSON.stringify(
                            lastBiometricTest.result || {},
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No biometric test has been run yet. Execute a provider
                        test to inspect the latest structured response.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={configProviderOpen} onOpenChange={setConfigProviderOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit {activeProviderLabel} configuration</DialogTitle>
            <DialogDescription>
              Update credentials, activation posture, and readiness settings for
              the current biometric provider from one modal workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-sm font-semibold">{activeProviderLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {providerCatalog[activeProvider]?.description ||
                    "Configure this provider with the required credentials and thresholds."}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activeProvider === "facepp" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-facepp-api-key">API key</Label>
                        <Input
                          id="modal-facepp-api-key"
                          value={apiKey}
                          onChange={(event) => setApiKey(event.target.value)}
                          placeholder={
                            facepp?.api_key_masked || "Paste Face++ API key"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-facepp-api-secret">
                          API secret
                        </Label>
                        <Input
                          id="modal-facepp-api-secret"
                          value={apiSecret}
                          onChange={(event) => setApiSecret(event.target.value)}
                          placeholder={
                            facepp?.api_secret_masked ||
                            "Paste Face++ API secret"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-facepp-base-url">Base URL</Label>
                        <Input
                          id="modal-facepp-base-url"
                          value={baseUrl}
                          onChange={(event) => setBaseUrl(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-facepp-threshold">
                          Confidence threshold
                        </Label>
                        <Input
                          id="modal-facepp-threshold"
                          type="number"
                          min="1"
                          max="100"
                          value={threshold}
                          onChange={(event) => setThreshold(event.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  {activeProvider === "aws_rekognition" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-aws-region">Region</Label>
                        <Input
                          id="modal-aws-region"
                          value={awsRegion}
                          onChange={(event) => setAwsRegion(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-aws-access-key">Access key</Label>
                        <Input
                          id="modal-aws-access-key"
                          value={awsAccessKeyId}
                          onChange={(event) =>
                            setAwsAccessKeyId(event.target.value)
                          }
                          placeholder={
                            awsRekognition?.access_key_id_masked ||
                            "Paste AWS access key"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-aws-secret">Secret key</Label>
                        <Input
                          id="modal-aws-secret"
                          value={awsSecretAccessKey}
                          onChange={(event) =>
                            setAwsSecretAccessKey(event.target.value)
                          }
                          placeholder={
                            awsRekognition?.secret_access_key_masked ||
                            "Paste AWS secret key"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-aws-threshold">
                          Similarity threshold
                        </Label>
                        <Input
                          id="modal-aws-threshold"
                          type="number"
                          min="1"
                          max="100"
                          value={awsThreshold}
                          onChange={(event) =>
                            setAwsThreshold(event.target.value)
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  {activeProvider === "azure_face" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-azure-endpoint">Endpoint</Label>
                        <Input
                          id="modal-azure-endpoint"
                          value={azureEndpoint}
                          onChange={(event) =>
                            setAzureEndpoint(event.target.value)
                          }
                          placeholder={azureFace?.endpoint || "https://..."}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-azure-api-key">API key</Label>
                        <Input
                          id="modal-azure-api-key"
                          value={azureApiKey}
                          onChange={(event) =>
                            setAzureApiKey(event.target.value)
                          }
                          placeholder={
                            azureFace?.api_key_masked || "Paste Azure API key"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-azure-threshold">
                          Confidence threshold
                        </Label>
                        <Input
                          id="modal-azure-threshold"
                          type="number"
                          min="1"
                          max="100"
                          value={azureThreshold}
                          onChange={(event) =>
                            setAzureThreshold(event.target.value)
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  {activeProvider === "google_vision" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-google-project-id">
                          Project ID
                        </Label>
                        <Input
                          id="modal-google-project-id"
                          value={googleProjectId}
                          onChange={(event) =>
                            setGoogleProjectId(event.target.value)
                          }
                          placeholder={googleVision?.project_id || "project-id"}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-google-api-key">API key</Label>
                        <Input
                          id="modal-google-api-key"
                          value={googleApiKey}
                          onChange={(event) =>
                            setGoogleApiKey(event.target.value)
                          }
                          placeholder={
                            googleVision?.api_key_masked ||
                            "Paste Google API key"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-google-threshold">
                          Confidence threshold
                        </Label>
                        <Input
                          id="modal-google-threshold"
                          type="number"
                          min="1"
                          max="100"
                          value={googleThreshold}
                          onChange={(event) =>
                            setGoogleThreshold(event.target.value)
                          }
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Live provider test</p>
                  <p className="text-sm text-muted-foreground">
                    Run a readiness check before saving this provider to
                    production workflows.
                  </p>
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="modal-provider-test-image">
                    Test image URL
                  </Label>
                  <Input
                    id="modal-provider-test-image"
                    value={testImageUrl}
                    onChange={(event) => setTestImageUrl(event.target.value)}
                  />
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => void handleTestProvider()}
                    disabled={isProviderActionActive(activeProvider)}
                    className="w-full"
                  >
                    {providerAction?.providerKey === activeProvider &&
                    providerAction.action === "test" ? (
                      <LoadingButtonContent label="Testing provider..." />
                    ) : (
                      "Run provider test"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Setup checklist</p>
                <p className="text-sm text-muted-foreground">
                  Add everything required before enabling this provider for
                  tenant workflows.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(providerCatalog[activeProvider]?.requirements || []).map(
                  (item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ),
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                {Boolean(activeProviderSettings.enabled)
                  ? "This provider already exists in the platform catalog. You can re-save configuration, test readiness, or delete it from this panel."
                  : "This provider is not yet created in the platform catalog. Save the configuration first, then create or enable it."}
              </div>
              <Button
                className="w-full"
                onClick={() => void handleSaveBiometrics()}
                disabled={isProviderActionActive(activeProvider)}
              >
                {providerAction?.providerKey === activeProvider &&
                providerAction.action === "save" ? (
                  <LoadingButtonContent label="Saving provider settings..." />
                ) : (
                  "Save provider configuration"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleCreateProvider(activeProvider)}
                disabled={isProviderActionActive(activeProvider)}
              >
                {providerAction?.providerKey === activeProvider &&
                providerAction.action === "create" ? (
                  <LoadingButtonContent
                    label={
                      Boolean(activeProviderSettings.enabled)
                        ? "Re-saving provider..."
                        : "Creating provider..."
                    }
                  />
                ) : Boolean(activeProviderSettings.enabled) ? (
                  "Re-save provider"
                ) : (
                  "Create or enable provider"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={() => void handleDeleteProvider(activeProvider)}
                disabled={
                  isProviderActionActive(activeProvider) ||
                  !Boolean(activeProviderSettings.enabled)
                }
              >
                {providerAction?.providerKey === activeProvider &&
                providerAction.action === "delete" ? (
                  <LoadingButtonContent label="Removing provider..." />
                ) : (
                  "Delete provider"
                )}
              </Button>
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={() => void handleSaveBiometrics()}
              disabled={isProviderActionActive(activeProvider)}
            >
              {providerAction?.providerKey === activeProvider &&
              providerAction.action === "save" ? (
                <LoadingButtonContent label="Saving..." />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Operational controls</CardTitle>
          <CardDescription>
            Jump directly into the platform areas that require active oversight.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {workspaceLinks.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.href}
                className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline">Platform</Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">{item.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="mt-auto">
                  <Button variant="outline" asChild>
                    <Link href={item.href}>Open</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Support posture</CardTitle>
          <CardDescription>
            Centralize communication and escalation handling without leaving the
            super-admin shell.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the support console for live queue inspection, then review
              notifications and audit logs for the wider operational context.
            </p>
          </div>
          <Button asChild>
            <Link href="/super-admin/support">
              <LifeBuoy className="mr-2 size-4" />
              Open support console
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
