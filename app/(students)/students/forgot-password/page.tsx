"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Vote
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
import {
  getTenantParticipantLabels,
  getTenantRecoveryIdentifierLabels,
} from "@/lib/tenant-config";
import { AnimatedThemeToggler } from "@/components/theme-toggler";

function StudentForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { forgotPassword, isLoading, error, clearError, tenant } =
    useStudentAuthStore();
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const labels = getTenantParticipantLabels(tenant);
  const recoveryLabels = getTenantRecoveryIdentifierLabels(tenant);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get("email") || "");
    setOrganization(searchParams.get("organization") || "");
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setSuccess(false);

    try {
      await forgotPassword(email.trim(), organization || null);
      setSuccess(true);
      setTimeout(() => {
        const nextSearch = new URLSearchParams({
          email: email.trim(),
        });
        if (organization) {
          nextSearch.set("organization", organization);
        }
        router.push(`/students/reset-password?${nextSearch.toString()}`);
      }, 1800);
    } catch {
      // Store handles the error state.
    }
  };

  const backHref = organization
    ? `/students/login?organization=${encodeURIComponent(organization)}`
    : "/students/login";

  return (
    <div className="min-h-svh overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl px-3">
          <Link href={backHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" className="h-9" />
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-6xl gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-stretch">
        <div className="relative hidden overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-muted/30 p-5 shadow-none md:block">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Vote className="h-3.5 w-3.5" />
              Password recovery
            </div>
            <h1 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Recover your {labels.singular.toLowerCase()} voting portal password
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Enter the recovery email tied to your account. We&apos;ll send a
              secure reset code so you can set a new password and get back into
              your sessions quickly.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  Fast recovery
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The reset code goes straight to your recovery channel so you
                  can move into the next step immediately.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure by design
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Recovery is scoped to your organization and keeps student
                  access protected during every step.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Recovery channels
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {recoveryLabels.length > 0
                  ? recoveryLabels.join(" or ")
                  : "Your configured recovery details"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                After the code arrives, continue to the reset page to create a
                new password for your portal.
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
                <CardTitle>Reset your portal password</CardTitle>
                <CardDescription>
                  Request a six-digit reset code for your{" "}
                  {labels.singular.toLowerCase()} account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-5">
            {success ? (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  If your account exists, a reset code has been sent.
                  Redirecting you to the secure reset form.
                </AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <LoadingButtonContent label="Sending reset code..." />
                ) : (
                  <>
                    Send reset code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                Already have your code? Continue to the password reset form and
                create a new password securely.
              </p>
              <p className="mt-2">
                Remembered your password?{" "}
                <Link
                  href={backHref}
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

export default function StudentForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <StudentForgotPasswordPageContent />
    </Suspense>
  );
}
