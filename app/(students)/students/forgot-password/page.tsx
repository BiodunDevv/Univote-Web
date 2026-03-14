"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import {
  getTenantParticipantLabels,
  getTenantLoginIdentifier,
  getTenantRecoveryIdentifierLabels,
} from "@/lib/tenant-config";

export default function StudentForgotPasswordPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const { forgotPassword, isLoading, error, clearError, tenant } = useStudentAuthStore();
  const [identifier, setIdentifier] = useState("");
  const organization = searchParams.get("organization") || "";
  const labels = getTenantParticipantLabels(tenant);
  const loginIdentifier = getTenantLoginIdentifier(tenant);
  const recoveryLabels = getTenantRecoveryIdentifierLabels(tenant);
  const recoveryHint =
    recoveryLabels.length > 0
      ? recoveryLabels.join(" or ")
      : "your recovery identifier";
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setSuccess(false);

    try {
      await forgotPassword(identifier.trim(), organization || null);
      setSuccess(true);
      setTimeout(() => {
        const nextSearch = new URLSearchParams({
          identifier: identifier.trim(),
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

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl items-center">
        <Card className="w-full border shadow-none">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-2 w-fit"
              onClick={() =>
                router.push(
                  organization
                    ? `/students/login?organization=${encodeURIComponent(organization)}`
                    : "/students/login",
                )
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-3">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Reset your portal password</CardTitle>
                <CardDescription>
                  Enter your {recoveryHint.toLowerCase()} and we&apos;ll send a six-digit reset code for your {labels.singular.toLowerCase()} portal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {success ? (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  If your account exists, a reset code has been sent. Redirecting you to the reset form.
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
                <Label htmlFor="identifier">{recoveryHint}</Label>
                <Input
                  id="identifier"
                  placeholder={`${loginIdentifier.placeholder} or your recovery email`}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Sending reset code..." : "Send reset code"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href={
                  organization
                    ? `/students/login?organization=${encodeURIComponent(organization)}`
                    : "/students/login"
                }
                className="font-medium text-foreground underline underline-offset-4"
              >
                Go back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
