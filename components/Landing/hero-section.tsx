"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { buildTenantAppUrl } from "@/lib/tenant";
import {
  readSharedAdminContext,
  subscribeSharedAdminContext,
} from "@/lib/shared-admin-context";
import { HeroIllustration } from "../HeroIllustration";

type HeroSectionProps = {
  stats?: {
    active_tenants: number;
    active_students: number;
    accepted_votes: number;
  };
};

export function HeroSection({ stats }: HeroSectionProps) {
  const sharedAdminContext = useSyncExternalStore(
    subscribeSharedAdminContext,
    readSharedAdminContext,
    () => null,
  );
  const {
    token,
    admin,
    tenant,
    hasHydrated: adminHasHydrated,
  } = useAuthStore();
  const {
    token: studentToken,
    hasHydrated: participantHasHydrated,
  } = useStudentAuthStore();
  const isCheckingSession = !adminHasHydrated || !participantHasHydrated;
  const tenantWorkspaceHref =
    tenant?.slug ||
    sharedAdminContext?.tenant?.slug ||
    sharedAdminContext?.organizations[0]?.slug
      ? buildTenantAppUrl(
          tenant?.slug ||
            sharedAdminContext?.tenant?.slug ||
            sharedAdminContext?.organizations[0]?.slug ||
            "",
          "/dashboard",
        )
      : "/dashboard";
  const primaryHref = isCheckingSession
    ? "#"
    : token
      ? admin?.role === "super_admin"
        ? "/super-admin"
        : tenantWorkspaceHref
      : sharedAdminContext?.organizations.length
        ? tenantWorkspaceHref
        : studentToken
          ? "/students/home"
          : "/students/login";
  const primaryLabel = isCheckingSession
    ? "Checking session"
    : token
      ? admin?.role === "super_admin"
        ? "Open Platform Console"
        : "Open Workspace"
      : sharedAdminContext?.organizations.length
        ? "Open Workspace"
        : studentToken
          ? "Open Portal"
          : "Portal Login";
  const proofItems = [
    "Subdomain workspaces for each organisation",
    "Configurable identity, structure, and voting rules",
    "Participant, admin, and super-admin access in one platform",
  ];
  const metricCards = [
    {
      label: "Active tenants",
      value: stats?.active_tenants ?? 0,
      icon: Building2,
    },
    {
      label: "Participant records",
      value: stats?.active_students ?? 0,
      icon: Users,
    },
    {
      label: "Votes processed",
      value: stats?.accepted_votes ?? 0,
      icon: Vote,
    },
  ];

  return (
    <section className="relative overflow-hidden pb-12 pt-24 sm:pb-16">
      <div className="container mx-auto px-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 sm:mt-6 lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-10">
          {/* Left Content */}
          <div className="w-full lg:max-w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground shadow-sm backdrop-blur">
              <BadgeCheck className="size-3.5 text-primary" />
              Multi-tenant voting workspace
            </div>

            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground lg:leading-[1.02]">
                Elections for universities, institutes, associations, and every
                organised voting body.
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7">
                Launch secure branded workspaces for each organisation, let each
                tenant choose how participants sign in, and run transparent
                digital elections without forcing every customer into one fixed
                structure.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <div className="rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Built for
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Campuses, councils, institutes, unions
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Identity
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Matric no, member ID, email, employee ID
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button
                className="h-11 rounded-xl px-5 text-sm"
                asChild={!isCheckingSession}
                disabled={isCheckingSession}
              >
                {isCheckingSession ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {primaryLabel}
                  </span>
                ) : (
                  <Link href={primaryHref}>{primaryLabel}</Link>
                )}
              </Button>
              {!token && !studentToken ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-5 text-sm"
                  asChild
                >
                  <a href="#apply">
                    Start Tenant Application
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
              ) : null}
            </div>

            {/* <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {proofItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-2xl border border-border/60 bg-background/72 px-3 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur"
                >
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div> */}

            {!token && !studentToken ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                <span>
                  Participant login stays simple while admin and workspace access
                  adapt to the organisation you select.
                </span>
              </div>
            ) : null}

            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {metricCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/85 p-3 shadow-sm backdrop-blur"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4" />
                    <span className="text-[11px] uppercase tracking-[0.2em]">
                      {label}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                    {value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-full">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
