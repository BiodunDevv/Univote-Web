"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  FileText,
  Layers3,
  Rocket,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  usePlatformOverviewQuery,
  usePlatformSettingsQuery,
  useTestPlatformBiometricsMutation,
  useUpdatePlatformSettingsMutation,
  usePlatformTenantsQuery,
} from "@/lib/queries/platform";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { TenantPageHeader } from "@/components/tenants/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    getProfile,
    updateProfile,
    changePassword,
  } = useSettingsStore();
  const overviewQuery = usePlatformOverviewQuery();
  const onboardingQuery = usePlatformTenantsQuery({
    status: "pending_approval",
    limit: 1,
  });
  const settingsQuery = usePlatformSettingsQuery();
  const updateSettings = useUpdatePlatformSettingsMutation();
  const testBiometrics = useTestPlatformBiometricsMutation();

  const overview = overviewQuery.data?.overview;
  const biometrics = settingsQuery.data?.biometrics.providers.aws_rekognition;

  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsThreshold, setAwsThreshold] = useState("90");
  const [collectionPrefix, setCollectionPrefix] = useState("univote");
  const [livenessRequired, setLivenessRequired] = useState(true);
  const [livenessThreshold, setLivenessThreshold] = useState("80");
  const [testImageUrl, setTestImageUrl] = useState(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [biometricSaving, setBiometricSaving] = useState(false);
  const [biometricTesting, setBiometricTesting] = useState(false);
  const [lastBiometricTest, setLastBiometricTest] = useState<{
    provider: string;
    summary?: Record<string, unknown>;
    provider_status?: Record<string, unknown>;
    result?: Record<string, unknown>;
    provider_response?: Record<string, unknown>;
    message?: string;
  } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const lastProfileSyncKey = useRef<string | null>(null);

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

  useEffect(() => {
    if (!biometrics) return;
    setAwsRegion(biometrics.region || "us-east-1");
    setAwsAccessKeyId(biometrics.access_key_id_value || "");
    setAwsSecretAccessKey(biometrics.secret_access_key_value || "");
    setAwsThreshold(String(biometrics.similarity_threshold || 70));
    setCollectionPrefix(biometrics.collection_prefix || "univote");
    setLivenessRequired(biometrics.liveness_required !== false);
    setLivenessThreshold(String(biometrics.liveness_threshold || 70));
  }, [biometrics]);

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

  const handleSaveBiometrics = async () => {
    setBiometricSaving(true);
    try {
      const result = await updateSettings.mutateAsync({
        biometrics: {
          active_provider: "aws_rekognition",
          providers: {
            aws_rekognition: {
              access_key_id: awsAccessKeyId || undefined,
              secret_access_key: awsSecretAccessKey || undefined,
              region: awsRegion,
              similarity_threshold: Number(awsThreshold || 70),
              collection_prefix: collectionPrefix || undefined,
              liveness_required: livenessRequired,
              liveness_threshold: Number(livenessThreshold || 70),
              enabled: true,
            },
          },
        },
      });
      toast.success(result.message || "AWS biometric settings updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update AWS biometric settings",
      );
    } finally {
      setBiometricSaving(false);
    }
  };

  const handleTestBiometrics = async () => {
    setBiometricTesting(true);
    try {
      const result = await testBiometrics.mutateAsync({
        imageUrl: testImageUrl,
        providerKey: "aws_rekognition",
      });
      setLastBiometricTest(result);
      toast.success("AWS biometric test succeeded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "AWS biometric test failed",
      );
    } finally {
      setBiometricTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <TenantPageHeader
        eyebrow="Platform console"
        icon={<Settings className="h-4 w-4" />}
        title="Platform Settings"
        subtitle="Platform-wide controls, tenant lifecycle supervision, and AWS biometric configuration for all universities."
        stats={
          overview
            ? [
                { label: "Active tenants", value: overview.active_tenants },
                { label: "Total tenants", value: overview.total_tenants },
                { label: "Pending approval", value: onboardingQuery.data?.total ?? "—" },
              ]
            : undefined
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-1 border-b border-border/70 px-0 pb-2"
        >
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl px-4 py-2">
            Account
          </TabsTrigger>
          <TabsTrigger value="biometrics" className="rounded-xl px-4 py-2">
            Biometrics
          </TabsTrigger>
          <TabsTrigger value="workspace" className="rounded-xl px-4 py-2">
            Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                  Universities currently provisioned and running on the platform.
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
                  Total universities provisioned on Univote.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>Pending approval</CardDescription>
                <CardTitle className="text-lg sm:text-xl">
                  {onboardingQuery.data ? onboardingQuery.data.total : "--"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Universities waiting on platform activation review.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>AWS biometrics</CardDescription>
                <CardTitle className="text-lg sm:text-xl">
                  {biometrics?.configured ? "Configured" : "Pending"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Region {biometrics?.region || "Not set"} with{" "}
                  {biometrics?.liveness_required === false
                    ? "optional"
                    : "required"}{" "}
                  liveness checks.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/70 shadow-none">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your super-admin identity and primary contact email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="super-admin-name">Full name</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Layers3 className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="super-admin-name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="super-admin-email">Email</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Bell className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="super-admin-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </InputGroup>
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
                  Rotate your password without leaving platform settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="super-admin-current-password">
                    Current password
                  </Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <ShieldCheck className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="super-admin-current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </InputGroup>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="super-admin-new-password">New password</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="super-admin-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="super-admin-confirm-password">
                      Confirm new password
                    </Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="super-admin-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                      />
                    </InputGroup>
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
        </TabsContent>

        <TabsContent value="biometrics" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card className="border-border/70 shadow-none">
              <CardHeader>
                <CardTitle>AWS biometric configuration</CardTitle>
                <CardDescription>
                  Univote now uses AWS Rekognition and AWS liveness only. Configure
                  the shared platform defaults here for all universities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-region">Region</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Rocket className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-region"
                        value={awsRegion}
                        onChange={(event) => setAwsRegion(event.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-threshold">Similarity threshold</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={awsThreshold}
                        onChange={(event) => setAwsThreshold(event.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-access-key">Access key</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-access-key"
                        value={awsAccessKeyId}
                        onChange={(event) => setAwsAccessKeyId(event.target.value)}
                        placeholder={
                          biometrics?.access_key_id_masked || "Paste AWS access key"
                        }
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-secret">Secret key</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-secret"
                        value={awsSecretAccessKey}
                        onChange={(event) =>
                          setAwsSecretAccessKey(event.target.value)
                        }
                        placeholder={
                          biometrics?.secret_access_key_masked || "Paste AWS secret key"
                        }
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-collection-prefix">Collection prefix</Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <Layers3 className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-collection-prefix"
                        value={collectionPrefix}
                        onChange={(event) => setCollectionPrefix(event.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aws-liveness-threshold">
                      Liveness threshold
                    </Label>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <ShieldCheck className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="aws-liveness-threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={livenessThreshold}
                        onChange={(event) =>
                          setLivenessThreshold(event.target.value)
                        }
                      />
                    </InputGroup>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Require AWS liveness</p>
                    <p className="text-sm text-muted-foreground">
                      Enforce liveness checks before face verification during vote
                      submission.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={livenessRequired ? "default" : "outline"}
                    onClick={() => setLivenessRequired((current) => !current)}
                  >
                    {livenessRequired ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Provider: AWS Rekognition</Badge>
                  <Badge variant="outline">
                    {biometrics?.configured ? "Configured" : "Not configured"}
                  </Badge>
                  <Badge variant="outline">
                    Active provider: aws_rekognition
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void handleSaveBiometrics()}
                    disabled={biometricSaving}
                  >
                    {biometricSaving ? (
                      <LoadingButtonContent label="Saving AWS settings..." />
                    ) : (
                      "Save AWS settings"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-none">
              <CardHeader>
                <CardTitle>Diagnostics</CardTitle>
                <CardDescription>
                  Run a quick AWS verification test and confirm the platform
                  responds with usable biometric metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="test-image-url">Test image URL</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <FileText className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="test-image-url"
                      value={testImageUrl}
                      onChange={(event) => setTestImageUrl(event.target.value)}
                    />
                  </InputGroup>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void handleTestBiometrics()}
                  disabled={biometricTesting}
                >
                  {biometricTesting ? (
                    <LoadingButtonContent label="Testing AWS biometrics..." />
                  ) : (
                    "Run AWS test"
                  )}
                </Button>
                {lastBiometricTest ? (
                  <div className="space-y-3 rounded-2xl border bg-muted/20 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Provider</span>
                      <Badge>{lastBiometricTest.provider}</Badge>
                    </div>
                    {lastBiometricTest.message ? (
                      <p className="text-muted-foreground">
                        {lastBiometricTest.message}
                      </p>
                    ) : null}
                    <pre className="overflow-x-auto rounded-xl bg-background p-3 text-xs text-muted-foreground">
                      {JSON.stringify(lastBiometricTest, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Run a test image through the AWS biometric path to inspect the
                    current provider response.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle>Workspace shortcuts</CardTitle>
              <CardDescription>
                Jump directly into the platform surfaces you use most when managing
                university operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workspaceLinks.map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-border/70 bg-background p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
