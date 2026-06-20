"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  GraduationCap,
  KeyRound,
} from "lucide-react";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const hostTenantSlug = useMemo(() => deriveTenantSlugFromHostname(), []);
  const backToLoginHref = "/auth/signin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);

    try {
      await forgotPassword(email, hostTenantSlug || null);
      setSuccess(true);
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        const params = new URLSearchParams({ email });
        router.push(`/auth/reset-password?${params.toString()}`);
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
            Reset your password
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recover admin access to your workspace
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
              Root recovery is enabled. Univote will route you back into the
              correct workspace after recovery.
            </AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              If your account exists, a reset code has been sent. Redirecting
              you to the secure reset form.
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || success}
          >
            {isLoading ? "Sending reset code..." : "Send reset code"}
          </Button>
        </form>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <KeyRound className="h-3 w-3" />
            Recovery stays tied to your admin account and workspace access.
          </p>
          <p>
            Remembered your password?{" "}
            <Link
              href={backToLoginHref}
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
