"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { AuthBrandMark } from "@/components/Auth/auth-brand-mark";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

export default function StudentCreatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const ref = searchParams.get("ref") || "/students/home";
  const organization = searchParams.get("organization") || "";
  const labels = getTenantParticipantLabels(tenant);

  const strength =
    newPassword.length === 0
      ? 0
      : newPassword.length < 6
        ? 1
        : newPassword.length < 10
          ? 2
          : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
            ? 4
            : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "bg-destructive",
    "bg-amber-400",
    "bg-blue-500",
    "bg-emerald-500",
  ][strength];

  useEffect(() => {
    if (hasHydrated && !firstLoginToken && !(token && student?.first_login)) {
      const query = new URLSearchParams();
      if (organization) query.set("organization", organization);
      router.replace(`/students/login${query.toString() ? `?${query}` : ""}`);
    }
  }, [
    firstLoginToken,
    hasHydrated,
    organization,
    router,
    student?.first_login,
    token,
  ]);

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

    try {
      await changePassword(newPassword);
      router.replace(ref);
    } catch {
      return;
    }
  };

  return (
    <AuthPageShell
      backHref={
        organization
          ? `/students/login?organization=${encodeURIComponent(organization)}`
          : "/students/login"
      }
      backLabel="Back to sign in"
    >
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <AuthBrandMark />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create a new password
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Secure your account before entering the portal.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          Use at least 6 characters. This replaces the temporary password and
          unlocks your {labels.singular.toLowerCase()} portal session.
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockKeyhole className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={AUTH_INPUT_CLASS}
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>

              {/* Strength meter */}
              {newPassword.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step <= strength ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength:{" "}
                    <span className="font-medium text-foreground">
                      {strengthLabel}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockKeyhole className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={AUTH_INPUT_CLASS}
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
              {confirmPassword && confirmPassword !== newPassword ? (
                <p className="text-xs text-destructive">
                  Passwords do not match.
                </p>
              ) : null}
            </div>

            {localError || error ? (
              <Alert variant="destructive">
                <AlertDescription>{localError || error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="press-scale h-11 w-full rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingButtonContent label="Securing account..." />
              ) : (
                "Create password & enter portal"
              )}
            </Button>
        </form>
      </div>
    </AuthPageShell>
  );
}
