"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { AnimatedThemeToggler } from "@/components/theme-toggler";

function StudentResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading, error, clearError, tenant } =
    useStudentAuthStore();
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organization, setOrganization] = useState("");
  const [hideEmailInput, setHideEmailInput] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const labels = getTenantParticipantLabels(tenant);

  useEffect(() => {
    setEmail(searchParams.get("email") || searchParams.get("identifier") || "");
    setOrganization(searchParams.get("organization") || "");
    setHideEmailInput(Boolean(searchParams.get("email")));
  }, [searchParams]);

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

  return (
    <div className="min-h-svh overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl px-3">
          <Link href={forgotHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to recovery
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" className="h-9" />
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-6xl gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-stretch">
        <div className="relative hidden overflow-hidden rounded-2xl border bg-linear-to-br from-(--student-hero-from) via-card to-(--student-hero-to) p-5 shadow-none md:block">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Vote className="h-3.5 w-3.5" />
              Secure password reset
            </div>
            <h1 className="font-display mt-5 max-w-xl text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
              Reset your {labels.singular.toLowerCase()} portal password with
              confidence
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Enter the six-digit code sent to your recovery address, choose a
              new password, and we&apos;ll send you back to sign in with the
              updated credentials.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Strong reset flow
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your reset code and new password are checked together before
                  access is restored.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Account protection
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reset actions stay tied to your organization so only the right
                  student account can be recovered.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Password guidance
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Use at least eight characters and choose something you
                haven&apos;t used before for this portal.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Once the reset succeeds, you&apos;ll be redirected back to sign
                in with your new password.
              </p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border bg-card/95 shadow-none">
          <CardHeader className="border-b bg-muted/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-3">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Enter your reset code</CardTitle>
                <CardDescription>
                  Verify the code you received and create a new password for
                  your portal account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-5">
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
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@organization.org"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 rounded-2xl"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Reset code</Label>
                <Input
                  id="reset-code"
                  value={resetCode}
                  onChange={(event) =>
                    setResetCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="123456"
                  required
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="h-11 rounded-2xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    className="h-11 rounded-2xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl"
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

            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                Need another code? Request a fresh one and we&apos;ll send you
                back through the same secure recovery path.
              </p>
              <p className="mt-2">
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
          </CardContent>
        </Card>
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
