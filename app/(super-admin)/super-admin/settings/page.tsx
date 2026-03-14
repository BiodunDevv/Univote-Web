"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CreditCard,
  FileText,
  Layers3,
  LifeBuoy,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import {
  usePlatformBillingOverviewQuery,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";

const workspaceLinks = [
  {
    href: "/super-admin/billing",
    label: "Billing controls",
    description: "Review recurring revenue, invoice posture, and tenant subscription state.",
    icon: CreditCard,
  },
  {
    href: "/super-admin/onboarding",
    label: "Onboarding queue",
    description: "Move new institutions from payment to provisioning and activation.",
    icon: Rocket,
  },
  {
    href: "/super-admin/testimonials",
    label: "Testimonials",
    description: "Moderate marketing proof points and publish approved stories.",
    icon: Layers3,
  },
  {
    href: "/super-admin/notifications",
    label: "Notifications",
    description: "Track system notices, support escalation, and tenant lifecycle alerts.",
    icon: Bell,
  },
  {
    href: "/super-admin/system-health",
    label: "System health",
    description: "Inspect health metrics, infra posture, and platform readiness.",
    icon: ShieldCheck,
  },
  {
    href: "/super-admin/audit-logs",
    label: "Audit logs",
    description: "Inspect privileged actions across tenants, billing, and platform operations.",
    icon: FileText,
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
  const billingQuery = usePlatformBillingOverviewQuery();
  const onboardingQuery = usePlatformTenantsQuery({
    status: "pending_approval",
    limit: 1,
  });

  const overview = overviewQuery.data?.overview;
  const billing = billingQuery.data?.metrics;
  const settingsQuery = usePlatformSettingsQuery();
  const updateSettings = useUpdatePlatformSettingsMutation();
  const testBiometrics = useTestPlatformBiometricsMutation();
  const biometrics = settingsQuery.data?.biometrics;
  const facepp = settingsQuery.data?.biometrics.providers.facepp;
  const awsRekognition = settingsQuery.data?.biometrics.providers.aws_rekognition;
  const azureFace = settingsQuery.data?.biometrics.providers.azure_face;
  const googleVision = settingsQuery.data?.biometrics.providers.google_vision;
  const [activeProvider, setActiveProvider] = useState("facepp");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api-us.faceplusplus.com/facepp/v3");
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");

  useEffect(() => {
    if (!biometrics || !facepp) return;
    setActiveProvider(biometrics.active_provider || "facepp");
    setBaseUrl(facepp.base_url || "https://api-us.faceplusplus.com/facepp/v3");
    setThreshold(String(facepp.confidence_threshold || 80));
    setAwsRegion(awsRekognition?.region || "us-east-1");
    setAwsThreshold(String(awsRekognition?.similarity_threshold || 90));
    setAzureEndpoint(azureFace?.endpoint || "");
    setAzureThreshold(String(azureFace?.confidence_threshold || 80));
    setGoogleProjectId(googleVision?.project_id || "");
    setGoogleThreshold(String(googleVision?.confidence_threshold || 80));
  }, [biometrics, facepp, awsRekognition, azureFace, googleVision]);

  useEffect(() => {
    if (!token) return;
    void getProfile(token).catch(() => undefined);
  }, [getProfile, token]);

  useEffect(() => {
    if (profile?.full_name && profile.full_name !== fullName) {
      setFullName(profile.full_name);
    }
    if (profile?.email && profile.email !== email) {
      setEmail(profile.email);
    }
  }, [email, fullName, profile]);

  const handleSaveProfile = async () => {
    if (!token) return;
    try {
      const updatedProfile = await updateProfile(token, {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      });
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
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setSecurityMessage("New password and confirmation do not match.");
      toast.error("Password confirmation mismatch");
      return;
    }
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
    }
  };

  const handleSaveBiometrics = async () => {
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
              enabled: true,
            },
            aws_rekognition: {
              access_key_id: awsAccessKeyId || undefined,
              secret_access_key: awsSecretAccessKey || undefined,
              region: awsRegion,
              similarity_threshold: Number(awsThreshold || 90),
              enabled: true,
            },
            azure_face: {
              endpoint: azureEndpoint || undefined,
              api_key: azureApiKey || undefined,
              confidence_threshold: Number(azureThreshold || 80),
              enabled: true,
            },
            google_vision: {
              project_id: googleProjectId || undefined,
              api_key: googleApiKey || undefined,
              confidence_threshold: Number(googleThreshold || 80),
              enabled: true,
            },
          },
        },
      });
      toast.success(result.message || "Biometric settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update biometric settings");
    }
  };

  const handleTestProvider = async () => {
    try {
      const result = await testBiometrics.mutateAsync(testImageUrl);
      toast.success(`Provider test succeeded with ${result.provider}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider test failed");
    }
  };

  return (
    <div className="space-y-3">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold sm:text-xl">Platform Settings</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Use this workspace as the operating hub for platform-wide controls, tenant lifecycle
            supervision, and operational follow-up. Critical actions still live in their dedicated
            pages, but this gives super admins one clean control surface.
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
            <CardDescription>Recurring revenue</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {billing ? `N${billing.monthly_recurring_revenue_ngn.toLocaleString()}` : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Current monthly recurring revenue across active subscriptions.
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
              Tenants that cleared payment and are waiting on platform activation review.
            </p>
          </CardContent>
        </Card>
        <Card id="security" className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Scheduled downgrades</CardDescription>
            <CardTitle className="text-lg sm:text-xl">
              {billing ? billing.scheduled_downgrades : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Plan changes queued for the end of the current tenant billing cycle.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your super-admin identity, contact email, and the account details used across platform operations.
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
              <p className="font-medium text-foreground">{profile?.role || admin?.role || "super_admin"}</p>
              <p className="mt-1">
                Changes here update the identity shown in platform notifications, audit logs, announcements, and administrative activity.
              </p>
            </div>
            {profileMessage ? (
              <Alert>
                <AlertDescription>{profileMessage}</AlertDescription>
              </Alert>
            ) : null}
            <Button onClick={() => void handleSaveProfile()} disabled={settingsLoading}>
              {settingsLoading ? <LoadingButtonContent label="Saving profile..." /> : "Save profile changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Rotate your password without leaving the platform settings workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="super-admin-current-password">Current password</Label>
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
                <Label htmlFor="super-admin-confirm-password">Confirm new password</Label>
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
            <Button variant="outline" onClick={() => void handleChangePassword()} disabled={settingsLoading}>
              {settingsLoading ? <LoadingButtonContent label="Updating password..." /> : "Change password"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Biometric provider</CardTitle>
          <CardDescription>
            Platform-wide facial verification provider control for enrollment and vote verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="active-provider">Active provider</Label>
                <Select value={activeProvider} onValueChange={setActiveProvider}>
                  <SelectTrigger id="active-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facepp">Face++</SelectItem>
                    <SelectItem value="aws_rekognition">AWS Rekognition</SelectItem>
                    <SelectItem value="azure_face">Azure Face</SelectItem>
                    <SelectItem value="google_vision">Google Cloud Vision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{biometrics?.active_provider || "facepp"}</Badge>
              <Badge variant="outline">
                {biometrics?.provider_catalog?.[activeProvider]?.implemented
                  ? "Implemented"
                  : "Configuration ready"}
              </Badge>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Face++</p>
                    <p className="text-xs text-muted-foreground">
                      {facepp?.configured
                        ? `Configured via ${facepp.base_url}`
                        : "Configure to power live enrollment and verification now."}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {facepp?.configured ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="facepp-api-key">API key</Label>
                    <Input
                      id="facepp-api-key"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder={facepp?.api_key_masked || "Paste Face++ API key"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="facepp-api-secret">API secret</Label>
                    <Input
                      id="facepp-api-secret"
                      value={apiSecret}
                      onChange={(event) => setApiSecret(event.target.value)}
                      placeholder={facepp?.api_secret_masked || "Paste Face++ API secret"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="facepp-base-url">Base URL</Label>
                    <Input
                      id="facepp-base-url"
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="facepp-threshold">Confidence threshold</Label>
                    <Input
                      id="facepp-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={threshold}
                      onChange={(event) => setThreshold(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-3">
                  <p className="text-sm font-semibold">AWS Rekognition</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registry-ready provider slot for AWS deployments.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="aws-region">Region</Label>
                    <Input id="aws-region" value={awsRegion} onChange={(event) => setAwsRegion(event.target.value)} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="aws-access-key">Access key</Label>
                    <Input id="aws-access-key" value={awsAccessKeyId} onChange={(event) => setAwsAccessKeyId(event.target.value)} placeholder={awsRekognition?.access_key_id_masked || "Paste AWS access key"} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="aws-secret">Secret key</Label>
                    <Input id="aws-secret" value={awsSecretAccessKey} onChange={(event) => setAwsSecretAccessKey(event.target.value)} placeholder={awsRekognition?.secret_access_key_masked || "Paste AWS secret key"} />
                  </div>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-sm font-semibold">Azure Face</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registry-ready provider slot for Azure-hosted verification.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="azure-endpoint">Endpoint</Label>
                    <Input id="azure-endpoint" value={azureEndpoint} onChange={(event) => setAzureEndpoint(event.target.value)} placeholder={azureFace?.endpoint || "https://..."} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="azure-api-key">API key</Label>
                    <Input id="azure-api-key" value={azureApiKey} onChange={(event) => setAzureApiKey(event.target.value)} placeholder={azureFace?.api_key_masked || "Paste Azure API key"} />
                  </div>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-sm font-semibold">Google Cloud Vision</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registry-ready provider slot for Google Cloud rollouts.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="google-project-id">Project ID</Label>
                    <Input id="google-project-id" value={googleProjectId} onChange={(event) => setGoogleProjectId(event.target.value)} placeholder={googleVision?.project_id || "project-id"} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="google-api-key">API key</Label>
                    <Input id="google-api-key" value={googleApiKey} onChange={(event) => setGoogleApiKey(event.target.value)} placeholder={googleVision?.api_key_masked || "Paste Google API key"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider-test-image">Test image URL</Label>
              <Input
                id="provider-test-image"
                value={testImageUrl}
                onChange={(event) => setTestImageUrl(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void handleSaveBiometrics()}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <LoadingButtonContent label="Saving provider settings..." />
              ) : (
                "Save biometric settings"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleTestProvider()}
              disabled={testBiometrics.isPending}
              className="w-full"
            >
              {testBiometrics.isPending ? (
                <LoadingButtonContent label="Testing provider..." />
              ) : (
                "Run provider test"
              )}
            </Button>
            {testBiometrics.data ? (
              <p className="text-xs text-muted-foreground">
                Provider test succeeded with {testBiometrics.data.provider}.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

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
                  <p className="text-sm text-muted-foreground">{item.description}</p>
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
            Centralize communication and escalation handling without leaving the super-admin shell.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the support console for live queue inspection, then review notifications and audit
              logs for the wider operational context.
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
