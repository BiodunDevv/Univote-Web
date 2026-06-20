"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const AUTH_INPUT_CLASS = "text-base md:text-sm";

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
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const ref = searchParams.get("ref") || "/students/home";
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
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top banner */}
      <div className="border-b bg-linear-to-r from-(--student-hero-from) to-(--student-hero-to) px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <AuthBrandMark className="h-7 w-7" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                First sign-in
              </p>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Create a new password
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            Secure your {labels.singular.toLowerCase()} account before entering
            the portal. Use at least 6 characters — this replaces the temporary
            default password.
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
      </div>
    </div>
  );
}
