"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
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
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

export default function StudentResetPasswordPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const { resetPassword, isLoading, error, clearError, tenant } =
    useStudentAuthStore();
  const emailFromUrl =
    searchParams.get("email") || searchParams.get("identifier") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const organization = searchParams.get("organization") || "";
  const hideEmailInput = Boolean(searchParams.get("email"));
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
                    ? `/students/forgot-password?organization=${encodeURIComponent(organization)}`
                    : "/students/forgot-password",
                )
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to reset request
            </Button>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-3">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Enter your reset code</CardTitle>
                <CardDescription>
                  Use the six-digit code sent to your recovery channel and set a
                  new portal password.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {success ? (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Password reset successfully. Redirecting you back to the
                  portal sign-in page for {labels.plural.toLowerCase()}.
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
                <div className="rounded-xl border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                  Reset email:{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@organization.org"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
              >
                {isLoading ? "Resetting password..." : "Reset password"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Need a new code?{" "}
              <Link
                href={
                  organization
                    ? `/students/forgot-password?organization=${encodeURIComponent(organization)}`
                    : "/students/forgot-password"
                }
                className="font-medium text-foreground underline underline-offset-4"
              >
                Request another one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
