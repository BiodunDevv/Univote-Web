"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";
import { isApiError } from "@/lib/api/client";
import {
  buildTenantAuthAcceptUrl,
  buildPublicAppUrl,
  clearTenantSlugOverride,
  deriveTenantSlugFromHostname,
  isTenantHost,
} from "@/lib/tenant";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  AtSignIcon,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { LogoIcon } from "@/components/logo";
const AUTH_INPUT_CLASS = "text-base md:text-sm";

type TenantChoice = {
  tenant_id: string;
  name: string;
  slug: string;
  role: string;
  status?: string;
  primary_domain?: string | null;
};

function formatRoleLabel(role: string) {
  if (role === "owner") return "Tenant Owner";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hostTenantSlug = useMemo(() => deriveTenantSlugFromHostname(), []);
  const [tenantChoices, setTenantChoices] = useState<TenantChoice[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState("");
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [isSelectingTenant, setIsSelectingTenant] = useState(false);

  const isRootSignIn = !hostTenantSlug;

  const redirectAfterLogin = async (session: AuthSessionData) => {
    const ref = searchParams.get("ref");
    const redirectTarget =
      ref && ref.startsWith("/")
        ? ref
        : session.admin.role === "super_admin"
          ? "/super-admin"
          : "/dashboard";

    if (session.admin.role === "super_admin") {
      window.location.assign(buildPublicAppUrl(redirectTarget));
      return;
    }

    if (session.tenant?.slug) {
      const tenantTarget = redirectTarget.startsWith("/dashboard")
        ? redirectTarget
        : "/dashboard";

      if (!isTenantHost(session.tenant.slug)) {
        const handoffUrl = buildTenantAuthAcceptUrl(
          session.tenant.slug,
          tenantTarget,
          session,
        );
        window.location.assign(handoffUrl);
        return;
      }

      router.push(tenantTarget);
      return;
    }

    router.push(redirectTarget);
  };

  const completeLogin = async (tenantSlug?: string | null) => {
    if (isRootSignIn && !tenantSlug) {
      clearTenantSlugOverride();
    }
    const session = await login(email, password, tenantSlug || hostTenantSlug);
    await redirectAfterLogin(session);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setShowTenantDialog(false);
    setTenantChoices([]);
    setSelectedTenantSlug("");

    try {
      await completeLogin();
    } catch (caughtError) {
      if (
        isApiError(caughtError) &&
        caughtError.code === "TENANT_SELECTION_REQUIRED" &&
        Array.isArray(caughtError.payload?.tenants)
      ) {
        const choices = caughtError.payload.tenants as TenantChoice[];
        setTenantChoices(choices);
        setSelectedTenantSlug(choices[0]?.slug || "");
        setShowTenantDialog(true);
        clearError();
      }
    }
  };

  const handleTenantSelection = async () => {
    if (!selectedTenantSlug) return;

    setIsSelectingTenant(true);
    clearError();
    try {
      await completeLogin(selectedTenantSlug);
    } finally {
      setIsSelectingTenant(false);
    }
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {hostTenantSlug
                ? `Signing into ${hostTenantSlug}`
                : "Sign in to your admin workspace"}
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
                Root sign-in is enabled. Univote will detect the tenant
                workspace from your account and redirect you automatically
                after login.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field className="space-y-1.5">
                <FieldLabel htmlFor="email" className="flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isSelectingTenant}
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-start">
                    <AtSignIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="password"
                    className="flex items-center gap-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                  </FieldLabel>
                  <Link
                    href={
                      email.trim()
                        ? `/auth/forgot-password?email=${encodeURIComponent(email.trim())}`
                        : "/auth/forgot-password"
                    }
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isSelectingTenant}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                      disabled={isLoading || isSelectingTenant}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading || isSelectingTenant}
              className="w-full"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin animation-duration-[1.2s]">
                    <LogoIcon className="h-4 w-4" />
                  </span>
                  <span>Signing in...</span>
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              Recovery stays tied to your admin account and workspace access.
            </p>
            <p>
              Looking for the student portal?{" "}
              <Link
                href="/students/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Student sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Select your workspace</DialogTitle>
            <DialogDescription>
              This admin account belongs to multiple tenant workspaces. Choose
              where you want to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {tenantChoices.map((tenantChoice) => {
              const isSelected = selectedTenantSlug === tenantChoice.slug;
              return (
                <button
                  key={tenantChoice.tenant_id}
                  type="button"
                  onClick={() => setSelectedTenantSlug(tenantChoice.slug)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenantChoice.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tenantChoice.slug}.localhost
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: {formatRoleLabel(tenantChoice.role)}
                        {tenantChoice.primary_domain
                          ? ` • Domain: ${tenantChoice.primary_domain}`
                          : ""}
                      </p>
                    </div>
                    {isSelected ? (
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTenantDialog(false);
                clearError();
              }}
              disabled={isSelectingTenant}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleTenantSelection()}
              disabled={!selectedTenantSlug || isSelectingTenant}
            >
              {isSelectingTenant ? "Opening workspace..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
