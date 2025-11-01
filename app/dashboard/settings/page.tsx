"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { PageHeader } from "@/components/College/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Lock,
  Database,
  Server,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { admin, token, updateAdmin } = useAuthStore();
  const {
    profile,
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

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "system">(
    "profile"
  );

  // Profile form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Test email
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [emailTestMessage, setEmailTestMessage] = useState("");

  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.push("/auth/signin");
    }
  }, [token, router, isHydrated]);

  useEffect(() => {
    if (isHydrated && token) {
      getProfile(token);
      if (isSuperAdmin) {
        getSystemConfig(token);
        getSystemHealth(token);
        getDatabaseStats(token);
      }
    }
  }, [
    isHydrated,
    token,
    isSuperAdmin,
    getProfile,
    getSystemConfig,
    getSystemHealth,
    getDatabaseStats,
  ]);

  // Update form fields when profile is loaded
  useEffect(() => {
    if (profile && profile.full_name && profile.email) {
      if (fullName !== profile.full_name) {
        setFullName(profile.full_name);
      }
      if (email !== profile.email) {
        setEmail(profile.email);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!isHydrated || !token || !admin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage("");
    clearError();

    try {
      const updatedProfile = await updateProfile(token, {
        full_name: fullName,
        email,
      });
      setProfileMessage("Profile updated successfully!");

      // Update the auth store with the new profile data
      updateAdmin({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
      });
    } catch {
      setProfileMessage("");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    clearError();

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long");
      return;
    }

    try {
      await changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMessage("");
    }
  };

  const handleTestEmail = async () => {
    setEmailTestMessage("");
    clearError();

    if (!testEmailAddress) {
      setEmailTestMessage("Please enter an email address");
      return;
    }

    try {
      await testEmail(token, testEmailAddress);
      setEmailTestMessage("Test email sent successfully! Check your inbox.");
    } catch {
      setEmailTestMessage("");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "security" as const, label: "Security", icon: Lock },
    ...(isSuperAdmin
      ? [{ id: "system" as const, label: "System", icon: Server }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, security, and system configuration"
        onBack={() => router.push("/dashboard")}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b overflow-x-auto pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-4">
                {loading && !profile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-xs">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1.5 h-9"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 h-9"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Role</Label>
                      <Input
                        value={
                          profile?.role === "super_admin"
                            ? "Super Admin"
                            : "Admin"
                        }
                        disabled
                        className="mt-1.5 h-9 bg-muted"
                      />
                    </div>

                    {profileMessage && (
                      <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          {profileMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="h-9">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold">
                  Change Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-xs">
                      Current Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-xs">
                      New Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-xs">
                      Confirm New Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordMessage && (
                    <Alert
                      className={
                        passwordMessage.includes("successfully")
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }
                    >
                      {passwordMessage.includes("successfully") ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription
                        className={
                          passwordMessage.includes("successfully")
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }
                      >
                        {passwordMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loading} className="h-9">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Tab (Super Admin Only) */}
        {activeTab === "system" && isSuperAdmin && (
          <div className="space-y-4">
            {/* System Health */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                {loading && !systemHealth ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : systemHealth ? (
                  <div className="space-y-3">
                    {Object.entries(systemHealth.checks).map(([key, check]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {check.status === "healthy" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : check.status === "not_configured" ? (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {key}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {check.message}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            check.status === "healthy"
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                              : check.status === "not_configured"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Database Statistics */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                {loading && !databaseStats ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : databaseStats ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {databaseStats.students.total}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {databaseStats.students.active} active
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Votes</p>
                      <p className="text-2xl font-bold text-green-600">
                        {databaseStats.votes.total}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {databaseStats.votes.by_status.length} status types
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Colleges</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {databaseStats.colleges}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {databaseStats.admins.total} admins
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Test Email */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Test Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      onClick={handleTestEmail}
                      disabled={loading}
                      className="h-9"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test"
                      )}
                    </Button>
                  </div>
                  {emailTestMessage && (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {emailTestMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
