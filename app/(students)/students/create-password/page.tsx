"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

export default function StudentCreatePasswordPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const {
    firstLoginToken,
    token,
    student,
    hasHydrated,
    isLoading,
    error,
    clearError,
    changePassword,
    tenant,
  } = useStudentAuthStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const ref = searchParams.get("ref") || "/students/home";
  const labels = getTenantParticipantLabels(tenant);

  useEffect(() => {
    if (hasHydrated && !firstLoginToken && !(token && student?.first_login)) {
      router.replace("/students/login");
    }
  }, [firstLoginToken, hasHydrated, router, student?.first_login, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (newPassword === "1234") {
      setLocalError("Choose a password different from the default password.");
      return;
    }

    await changePassword(newPassword);
    router.replace(ref);
  };

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl items-center">
        <Card className="w-full border shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Create a new password</CardTitle>
                <CardDescription>
                  Secure your account before entering the {labels.singular.toLowerCase()} portal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              Use at least 6 characters. This password replaces the temporary default password used for your first sign in.
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {localError || error ? (
                <Alert variant="destructive">
                  <AlertDescription>{localError || error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingButtonContent label="Securing account..." />
                ) : (
                  "Create password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
