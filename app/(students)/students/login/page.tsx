"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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

  const { login, token, hasHydrated, isLoading, error, clearError, tenant } =
    useStudentAuthStore();

  const [search, setSearch] = useState("");
  const [selectedOrgSlug, setSelectedOrgSlug] = useState(
    hostTenantSlug || orgParam,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    if (hasHydrated && token) {
      router.replace(ref);
    }
  }, [hasHydrated, token, router, ref]);

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
        toast.warning("Temporary password in use", {
          description:
            "You can continue into the portal now, but you should change the default password immediately.",
        });
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

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-4 flex max-w-6xl justify-end">
        <AnimatedThemeToggler variant="header" className="h-9" />
      </div>
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="hidden rounded-4xl border bg-linear-to-br from-card via-card to-muted/30 p-8 shadow-none lg:block lg:p-10">
          <div className="inline-flex rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {selectedOrganization ? labels.singular : "Organization"} access
          </div>
          <h1 className="mt-6 max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {selectedOrganization
              ? `Sign in to access your ${labels.singular.toLowerCase()} portal, active sessions, and results.`
              : "Select your organization first, then continue into your portal."}
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            {selectedOrganization
              ? `Use your ${loginField.label.toLowerCase()} and current password. Shared organization links and subdomain links open this portal automatically.`
              : "Use the university chooser to find the right workspace. If an administrator shared a direct link, the university will already be selected for you."}
          </p>
        </div>

        <Card className="border shadow-none">
          {!selectedOrganization && !hostTenantSlug ? (
            <>
              <CardHeader>
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
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search universities"
                    className="pl-9"
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

                <div className="max-h-80 space-y-2 overflow-y-auto">
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
              <CardHeader>
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
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedOrganization ? (
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Organization
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
                        onClick={() => setSelectedOrgSlug("")}
                        className="mt-3 text-xs font-medium underline underline-offset-4"
                      >
                        Change organization
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading
                      ? "Signing in..."
                      : `Continue to ${labels.singular.toLowerCase()} portal`}
                    <ArrowRight className="ml-2 h-4 w-4" />
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
    </div>
  );
}
