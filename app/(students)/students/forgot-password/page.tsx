"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import {
  getTenantRecoveryIdentifierLabels,
} from "@/lib/tenant-config";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthBrandMark } from "@/components/Auth/auth-brand-mark";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

function StudentForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { forgotPassword, isLoading, error, clearError, tenant } =
    useStudentAuthStore();
  const initialEmail = searchParams.get("email") || "";
  const initialOrganization = searchParams.get("organization") || "";
  const [email, setEmail] = useState(initialEmail);
  const [organization] = useState(initialOrganization);
  const recoveryLabels = getTenantRecoveryIdentifierLabels(tenant);
  const [success, setSuccess] = useState(false);

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
  const organizationLabel = tenant?.name || organization || "your university";

  return (
    <AuthPageShell backHref={backHref} backLabel="Back to sign in">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <AuthBrandMark />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Reset your password
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Recover access to {organizationLabel}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {organization ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
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
                <div className="space-y-2">
                  <p className="text-start text-muted-foreground text-xs">
                    Enter your email address to continue recovery
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
                      <Mail className="h-4 w-4" />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
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

            <div className="space-y-2 text-center text-xs text-muted-foreground">
              <p className="flex items-center justify-center gap-1.5">
                <KeyRound className="h-3 w-3" />
                Recovery via{" "}
                {recoveryLabels.length > 0
                  ? recoveryLabels.join(" or ").toLowerCase()
                  : "your recovery details"}
                .
              </p>
              <p>
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
          </div>
    </AuthPageShell>
  );
}

export default function StudentForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <StudentForgotPasswordPageContent />
    </Suspense>
  );
}
