"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

function DotGrid() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] dark:opacity-[0.055]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="student-reset-dot-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#student-reset-dot-pattern)" />
    </svg>
  );
}

function StudentResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading, error, clearError, tenant } =
    useStudentAuthStore();
  const initialEmail =
    searchParams.get("email") || searchParams.get("identifier") || "";
  const initialOrganization = searchParams.get("organization") || "";
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organization] = useState(initialOrganization);
  const [hideEmailInput] = useState(Boolean(searchParams.get("email")));
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const labels = getTenantParticipantLabels(tenant);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword(
        email.trim(),
        resetCode.trim(),
        newPassword,
        organization || null,
      );
      setSuccess(true);
      setTimeout(() => {
        router.push(
          organization
            ? `/students/login?organization=${encodeURIComponent(organization)}`
            : "/students/login",
        );
      }, 1800);
    } catch {
      // Store handles error state.
    }
  };

  const forgotHref = organization
    ? `/students/forgot-password?organization=${encodeURIComponent(organization)}`
    : "/students/forgot-password";
  const loginHref = organization
    ? `/students/login?organization=${encodeURIComponent(organization)}`
    : "/students/login";
  const organizationLabel = tenant?.name || organization || "your university";

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <DotGrid />

      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={forgotHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to recovery
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Create a new password
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Finish recovering access to {organizationLabel}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {organization ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    University selected
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {organization}
                  </p>
                </div>
              </div>
            ) : null}

            {success ? (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Password reset successfully. Redirecting you back to the sign
                  in page for {labels.plural.toLowerCase()}.
                </AlertDescription>
              </Alert>
            ) : null}

            {localError || error ? (
              <Alert variant="destructive">
                <AlertDescription>{localError || error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {hideEmailInput ? (
                <div className="text-sm text-muted-foreground">
                  Recovery email:{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="email">Recovery email address</Label>
                  <div className="space-y-2">
                    <p className="text-start text-muted-foreground text-xs">
                      Enter your email address linked to this recovery flow
                    </p>
                    <InputGroup>
                      <InputGroupInput
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className={AUTH_INPUT_CLASS}
                      />
                      <InputGroupAddon align="inline-start">
                        <KeyRound className="h-4 w-4" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Reset code</Label>
                <InputGroup>
                  <InputGroupInput
                    id="reset-code"
                    value={resetCode}
                    onChange={(event) =>
                      setResetCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    inputMode="numeric"
                    placeholder="123456"
                    required
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-start">
                    <KeyRound className="h-4 w-4" />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <InputGroup>
                  <InputGroupInput
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                      disabled={isLoading || success}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <InputGroup>
                  <InputGroupInput
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                      disabled={isLoading || success}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <LoadingButtonContent label="Resetting password..." />
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="space-y-2 text-center text-xs text-muted-foreground">
              <p className="flex items-center justify-center gap-1.5">
                <KeyRound className="h-3 w-3" />
                Reset actions stay tied to your {labels.singular.toLowerCase()}{" "}
                account.
              </p>
              <p>
                Want to return to the portal now?{" "}
                <Link
                  href={loginHref}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Go back to sign in
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <StudentResetPasswordPageContent />
    </Suspense>
  );
}
