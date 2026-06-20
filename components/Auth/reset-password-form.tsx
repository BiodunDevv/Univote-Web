"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { deriveTenantSlugFromHostname } from "@/lib/tenant";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  AtSignIcon,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
} from "lucide-react";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const hostTenantSlug = useMemo(() => deriveTenantSlugFromHostname(), []);

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const loginHref = "/auth/signin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);
    setValidationError("");

    // Validation
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    try {
      await resetPassword(
        email,
        resetCode,
        newPassword,
        hostTenantSlug || null,
      );
      setSuccess(true);
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push(loginHref);
      }, 2000);
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create a new password
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Finish recovering your admin workspace access
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {hostTenantSlug ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                Tenant workspace detected
              </p>
              <p className="text-[11px] text-muted-foreground">
                {hostTenantSlug}
              </p>
            </div>
          </div>
        ) : (
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              Root recovery is enabled. Finish the reset and Univote will route
              you back into the correct workspace.
            </AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Password reset successfully. Redirecting you back to sign in.
            </AlertDescription>
          </Alert>
        ) : null}

        {error || validationError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || validationError}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Recovery email address
            </label>
            <InputGroup>
              <InputGroupInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || success}
                className={AUTH_INPUT_CLASS}
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon className="h-4 w-4" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="resetCode" className="text-sm font-medium">
              Reset code
            </label>
            <InputGroup>
              <InputGroupInput
                id="resetCode"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                disabled={isLoading || success}
                maxLength={6}
                className={AUTH_INPUT_CLASS}
              />
              <InputGroupAddon align="inline-start">
                <KeyRound className="h-4 w-4" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New password
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <LockKeyhole className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading || success}
                className={AUTH_INPUT_CLASS}
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  disabled={isLoading || success}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <LockKeyhole className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || success}
                className={AUTH_INPUT_CLASS}
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  disabled={isLoading || success}
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
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </form>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <KeyRound className="h-3 w-3" />
            Reset actions stay tied to your admin account and workspace access.
          </p>
          <p>
            Want to return to admin sign in now?{" "}
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
  );
}
