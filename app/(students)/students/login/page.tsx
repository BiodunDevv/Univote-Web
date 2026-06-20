"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import {
  usePublicOrganizationQuery,
  usePublicOrganizationsQuery,
} from "@/lib/queries/public";
import {
  getTenantLoginIdentifier,
  getTenantRecoveryIdentifierLabels,
} from "@/lib/tenant-config";
import { deriveTenantSlugFromHostname } from "@/lib/tenant";
import type { TenantContext } from "@/types/tenant";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthBrandMark } from "@/components/Auth/auth-brand-mark";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";

const AUTH_INPUT_CLASS = "text-base md:text-sm";

function StudentLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostTenantSlug = deriveTenantSlugFromHostname();
  const orgParam =
    searchParams.get("organization") || searchParams.get("org") || "";
  const ref = searchParams.get("ref") || "/students/home";
  const restrictionReason = searchParams.get("reason");

  const {
    login,
    token,
    student,
    hasHydrated,
    isLoading,
    error,
    clearError,
    tenant,
  } = useStudentAuthStore();
  const [search, setSearch] = useState("");
  const [selectedOrgSlug, setSelectedOrgSlug] = useState(
    hostTenantSlug || orgParam,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstLoginPromptOpen, setFirstLoginPromptOpen] = useState(false);
  const [postLoginRoute, setPostLoginRoute] = useState(ref);

  const organizationsQuery = usePublicOrganizationsQuery(search);
  const selectedOrganizationQuery = usePublicOrganizationQuery(
    hostTenantSlug || selectedOrgSlug,
    Boolean(hostTenantSlug || selectedOrgSlug),
  );

  const selectedOrganization =
    selectedOrganizationQuery.data?.organization ||
    organizationsQuery.data?.organizations.find(
      (o) => o.slug === (hostTenantSlug || selectedOrgSlug),
    ) ||
    null;

  const effectiveTenant: TenantContext | null =
    tenant ||
    (selectedOrganization
      ? {
          id: selectedOrganization.id,
          name: selectedOrganization.name,
          slug: selectedOrganization.slug,
          primary_domain: selectedOrganization.primary_domain || null,
          branding: selectedOrganization.branding || {},
          labels: selectedOrganization.labels,
          identity: selectedOrganization.identity
            ? {
                primary_identifier:
                  selectedOrganization.identity.primary_identifier,
                allowed_identifiers: selectedOrganization.identity
                  .allowed_identifiers || [
                  selectedOrganization.identity.primary_identifier,
                ],
                recovery_identifiers: selectedOrganization.identity
                  .recovery_identifiers || ["email"],
                display_identifier:
                  selectedOrganization.identity.display_identifier ||
                  selectedOrganization.identity.primary_identifier,
                login: selectedOrganization.identity.login,
              }
            : undefined,
        }
      : null);

  const loginField = getTenantLoginIdentifier(effectiveTenant);
  const recoveryLabels = getTenantRecoveryIdentifierLabels(effectiveTenant);

  const restrictionMessage =
    restrictionReason === "TENANT_SUSPENDED"
      ? "This university workspace is currently suspended."
      : restrictionReason === "TENANT_ACCESS_RESTRICTED"
        ? "This university workspace is currently restricted. Try again later."
        : null;

  useEffect(() => {
    if (
      hasHydrated &&
      token &&
      !student?.first_login &&
      !firstLoginPromptOpen
    ) {
      router.replace(ref);
    }
  }, [
    firstLoginPromptOpen,
    hasHydrated,
    ref,
    router,
    student?.first_login,
    token,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    const targetTenantSlug = hostTenantSlug || selectedOrgSlug || null;
    try {
      const result = await login(email, password, targetTenantSlug);
      if (result.newDevice) {
        toast.info("New device detected", {
          description:
            "A security email has been sent to your registered address.",
        });
      }
      if (result.requiresPasswordChange) {
        setPostLoginRoute(ref);
        setFirstLoginPromptOpen(true);
        return;
      }
      router.replace(ref);
    } catch (submitError) {
      if (
        submitError instanceof Error &&
        submitError.message === "FIRST_LOGIN"
      ) {
        const query = new URLSearchParams();
        query.set("ref", ref);
        if (targetTenantSlug) query.set("organization", targetTenantSlug);
        router.replace(`/students/create-password?${query.toString()}`);
      }
    }
  };

  const resetOrganizationSelection = () => {
    setSelectedOrgSlug("");
    setEmail("");
    setPassword("");
    clearError();
  };

  const routeToCreatePassword = () => {
    const query = new URLSearchParams();
    query.set("ref", postLoginRoute);
    if (hostTenantSlug || selectedOrgSlug) {
      query.set("organization", hostTenantSlug || selectedOrgSlug);
    }
    router.push(`/students/create-password?${query.toString()}`);
  };

  const showSignInForm = Boolean(selectedOrganization || hostTenantSlug);

  return (
    <AuthPageShell backHref="/" backLabel="Back to website">
          {/* Brand mark */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <AuthBrandMark />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {showSignInForm ? "Welcome back" : "Student portal"}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {showSignInForm
                  ? selectedOrganization
                    ? `Signing in to ${selectedOrganization.name}`
                    : "Sign in to your student portal"
                  : "Select your university to continue"}
              </p>
            </div>
          </div>

          {/* ── University picker ────────────────────────────────── */}
          {!showSignInForm ? (
            <div className="space-y-3">
              {/* Search */}
              <div className="space-y-2">
                <p className="text-start text-muted-foreground text-xs">
                  Search for your university workspace
                </p>
                <InputGroup>
                  <InputGroupInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for your university…"
                    autoFocus
                    className={AUTH_INPUT_CLASS}
                  />
                  <InputGroupAddon align="inline-start">
                    <Search className="h-4 w-4" />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {/* University list */}
              <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg">
                {organizationsQuery.isFetching ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <LoadingButtonContent label="Searching…" />
                  </div>
                ) : (organizationsQuery.data?.organizations || []).length ===
                  0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No universities found
                    </p>
                  </div>
                ) : (
                  (organizationsQuery.data?.organizations || []).map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrgSlug(org.slug)}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left transition-colors hover:bg-accent active:scale-[0.99]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {org.slug}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Only registered university workspaces appear here.
              </p>
            </div>
          ) : (
            /* ── Sign-in form ────────────────────────────────────── */
            <div className="space-y-4">
              {/* University badge */}
              {selectedOrganization ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {selectedOrganization.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedOrganization.slug}
                    </p>
                  </div>
                  {!hostTenantSlug ? (
                    <button
                      type="button"
                      onClick={resetOrganizationSelection}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Change
                    </button>
                  ) : null}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-email"
                    className="flex items-center gap-1.5"
                  >
                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    {loginField.label}
                  </Label>
                  <div className="space-y-2">
                    <InputGroup>
                      <InputGroupInput
                        id="login-email"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        placeholder={loginField.placeholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className={AUTH_INPUT_CLASS}
                      />
                      <InputGroupAddon align="inline-start">
                        <UserCircle className="h-4 w-4" />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="login-password"
                      className="flex items-center gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Password
                    </Label>
                    <Link
                      href={
                        selectedOrganization
                          ? `/students/forgot-password?organization=${selectedOrganization.slug}${email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ""}`
                          : `/students/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`
                      }
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className={AUTH_INPUT_CLASS}
                    />
                    <InputGroupAddon align="inline-end">
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
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

                {restrictionMessage ? (
                  <Alert>
                    <AlertDescription>{restrictionMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <LoadingButtonContent label="Signing in…" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Separator />

              {/* Footer links */}
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
                  Not a student?{" "}
                  <Link
                    href="/auth/signin"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Admin sign in
                  </Link>
                </p>
              </div>
            </div>
          )}
      {/* First-login prompt */}
      <Dialog
        open={firstLoginPromptOpen}
        onOpenChange={setFirstLoginPromptOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Secure your account
            </DialogTitle>
            <DialogDescription>
              You signed in with a default password. Create a personal password
              now to keep your account secure.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Recommended: set your password now before continuing to the portal.
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFirstLoginPromptOpen(false);
                router.replace(postLoginRoute);
              }}
            >
              Skip for now
            </Button>
            <Button type="button" onClick={routeToCreatePassword}>
              Set password
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthPageShell>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={null}>
      <StudentLoginPageContent />
    </Suspense>
  );
}
