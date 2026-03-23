"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import {
  usePublicOrganizationQuery,
  usePublicOrganizationsQuery,
} from "@/lib/queries/public";
import {
  getTenantLoginIdentifier,
  getTenantParticipantLabels,
  getTenantRecoveryIdentifierLabels,
} from "@/lib/tenant-config";
import { deriveTenantSlugFromHostname } from "@/lib/tenant";
import type { TenantContext } from "@/types/tenant";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { useStudentPwaInstallState } from "@/lib/store/useStudentPwaStore";

export default function StudentLoginPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const hostTenantSlug = useMemo(() => deriveTenantSlugFromHostname(), []);
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
  const { canInstall, isPrompting, promptInstall } =
    useStudentPwaInstallState();

  const [search, setSearch] = useState("");
  const [selectedOrgSlug, setSelectedOrgSlug] = useState(
    hostTenantSlug || orgParam,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      (organization) =>
        organization.slug === (hostTenantSlug || selectedOrgSlug),
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
  const labels = getTenantParticipantLabels(effectiveTenant);
  const recoveryLabels = getTenantRecoveryIdentifierLabels(effectiveTenant);

  const restrictionMessage =
    restrictionReason === "TENANT_SUSPENDED"
      ? "This university workspace is currently suspended. Student portal access is unavailable until an administrator restores the workspace."
      : restrictionReason === "TENANT_ACCESS_RESTRICTED"
        ? "This university workspace is currently restricted. Try again later or contact an administrator."
        : null;

  useEffect(() => {
    if (hasHydrated && token && !student?.first_login && !firstLoginPromptOpen) {
      router.replace(ref);
    }
  }, [firstLoginPromptOpen, hasHydrated, ref, router, student?.first_login, token]);

  useEffect(() => {
    if (hostTenantSlug) {
      setSelectedOrgSlug(hostTenantSlug);
    }
  }, [hostTenantSlug]);

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
        if (targetTenantSlug) {
          query.set("organization", targetTenantSlug);
        }
        router.replace(`/students/create-password?${query.toString()}`);
      }
    }
  };

  const handleInstall = async () => {
    await promptInstall();
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

  return (
    <div className="min-h-svh overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl px-3">
          <Link href="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Website
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" className="h-9" />
      </div>
      <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-6xl gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-muted/30 p-5 shadow-none hidden md:block">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedOrganization ? labels.singular : "University"} access
            </div>
            <h1 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {selectedOrganization
                ? `Sign in to enter your ${labels.singular.toLowerCase()} voting workspace.`
                : "Choose your university and continue into the student voting app."}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              {selectedOrganization
                ? `Use your ${loginField.label.toLowerCase()} and password to open sessions, vote securely, and track results from one clean mobile-friendly portal.`
                : "Search for your university workspace first. Once selected, you can sign in, install the app, and move straight into your student dashboard."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Mobile-first flow
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Install the student app, sign in once, and move through sessions
                  and voting with a cleaner mobile experience.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 shadow-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure access
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your university workspace keeps sign-in, recovery, and voting
                  access scoped to your institution only.
                </p>
              </div>
            </div>

            {selectedOrganization ? (
              <div className="mt-6 rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Selected university
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  University Name: {selectedOrganization.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  University Slug: {selectedOrganization.slug}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border bg-card/95 shadow-none">
          {!selectedOrganization && !hostTenantSlug ? (
            <>
              <CardHeader className="border-b bg-muted/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border bg-muted p-3">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Select University</CardTitle>
                    <CardDescription>
                      Choose the university you belong to before signing in.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-3">
                {canInstall ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center rounded-2xl"
                    onClick={() => void handleInstall()}
                    disabled={isPrompting}
                  >
                    {isPrompting ? (
                      <LoadingButtonContent label="Opening install prompt..." />
                    ) : (
                      "Install app"
                    )}
                  </Button>
                ) : null}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search universities"
                    className="h-11 rounded-2xl pl-9"
                  />
                </div>

                {organizationsQuery.isFetching ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <LoadingButtonContent label="Fetching universities..." />
                  </Button>
                ) : null}

                <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                  {(organizationsQuery.data?.organizations || []).map(
                    (organization) => (
                      <button
                        key={organization.id}
                        type="button"
                        onClick={() => setSelectedOrgSlug(organization.slug)}
                        className="flex w-full items-start justify-between rounded-2xl border border-border/70 bg-card/50 p-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {organization.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {organization.slug}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      </button>
                    ),
                  )}
                </div>

                {organizationsQuery.data?.organizations.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No universities matched your search.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="border-b bg-muted/10 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border bg-muted p-3">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Portal Sign In</CardTitle>
                      <CardDescription>
                        {selectedOrganization
                          ? `Continue to ${selectedOrganization.name}.`
                          : `Continue to the Univote ${labels.singular.toLowerCase()} portal.`}
                      </CardDescription>
                    </div>
                  </div>
                  {!hostTenantSlug ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl px-3"
                      onClick={resetOrganizationSelection}
                    >
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {canInstall ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center rounded-2xl"
                    onClick={() => void handleInstall()}
                    disabled={isPrompting}
                  >
                    {isPrompting ? (
                      <LoadingButtonContent label="Opening install prompt..." />
                    ) : (
                      "Install app"
                    )}
                  </Button>
                ) : null}

                {selectedOrganization ? (
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      University
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedOrganization.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrganization.slug}
                    </p>
                    {!hostTenantSlug ? (
                      <button
                        type="button"
                        onClick={resetOrganizationSelection}
                        className="mt-3 text-xs font-medium underline underline-offset-4"
                      >
                        Change university
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{loginField.label}</Label>
                    <Input
                      id="email"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholder={loginField.placeholder}
                      className="h-11 rounded-2xl"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="h-11 rounded-2xl"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={
                        selectedOrganization
                          ? `/students/forgot-password?organization=${selectedOrganization.slug}${email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ""}`
                          : `/students/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`
                      }
                      className="text-sm font-medium text-foreground underline underline-offset-4"
                    >
                      Forgot password?
                    </Link>
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

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingButtonContent label="Signing in..." />
                    ) : (
                      <>
                        Continue to {labels.singular.toLowerCase()} portal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  <p>
                    Password recovery is available through{" "}
                    {recoveryLabels.length > 0
                      ? recoveryLabels.join(" or ").toLowerCase()
                      : "your recovery details"}
                    .
                  </p>
                  <p className="mt-2">
                    Admin access lives in the management portal.{" "}
                    <Link
                      href="/auth/signin"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Sign in as an administrator
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Dialog
        open={firstLoginPromptOpen}
        onOpenChange={setFirstLoginPromptOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Secure your account</DialogTitle>
            <DialogDescription>
              You just signed in with the default password for the first time.
              Change it now for better security, or continue and update it from
              your profile immediately after entry.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            Recommended: create a new password now so your student portal stays
            protected before you continue.
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
              Continue with current password
            </Button>
            <Button type="button" onClick={routeToCreatePassword}>
              Change password now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
