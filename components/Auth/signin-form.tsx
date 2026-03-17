"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";
import { isApiError } from "@/lib/api/client";
import {
  buildTenantAuthAcceptUrl,
  deriveTenantSlugFromHostname,
  isTenantHost,
} from "@/lib/tenant";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { LogoIcon } from "@/components/logo";

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

  const redirectAfterLogin = async (session: AuthSessionData) => {
    const ref = searchParams.get("ref");
    const redirectTarget =
      ref && ref.startsWith("/")
        ? ref
        : session.admin.role === "super_admin"
          ? "/super-admin"
          : "/dashboard";

    if (session.admin.role !== "super_admin" && session.tenant?.slug) {
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="w-fit h-9 text-xs"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back to Home
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              {hostTenantSlug
                ? `Signing into ${hostTenantSlug}. Enter your email and password to continue.`
                : "Enter your email and password. Tenant admins will be routed into the correct workspace automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {hostTenantSlug ? (
                  <Alert>
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      Tenant workspace detected:{" "}
                      <span className="font-medium">{hostTenantSlug}</span>
                    </AlertDescription>
                  </Alert>
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

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isSelectingTenant}
                  />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || isSelectingTenant}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading || isSelectingTenant}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field>
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
                        <span>Logging in...</span>
                      </span>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
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
