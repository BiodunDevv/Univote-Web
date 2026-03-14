"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Building2, CheckCircle2, Users, Vote } from "lucide-react";
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
  const { token, admin, tenant } = useAuthStore();
  const { token: studentToken } = useStudentAuthStore();
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
  const primaryHref = token
    ? admin?.role === "super_admin"
      ? "/super-admin"
      : tenantWorkspaceHref
    : sharedAdminContext?.organizations.length
      ? tenantWorkspaceHref
      : studentToken
        ? "/students/home"
        : "/students/login";
  const primaryLabel = token
    ? admin?.role === "super_admin"
      ? "Open Platform Console"
      : "Open Workspace"
    : sharedAdminContext?.organizations.length
      ? "Open Workspace"
    : studentToken
        ? "Open Portal"
        : "Portal Login";
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
    <section className="relative overflow-hidden pb-10 pt-24">
      <div className="container mx-auto px-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-6 sm:mt-10 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
          {/* Left Content */}
          <div className="w-full lg:max-w-full">
            <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Revolutionize Campus Elections with Smart Digital Voting
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Secure, transparent, and efficient digital elections tailored for universities. Empower your campus with cutting-edge voting technology.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button className="rounded-xl text-sm" asChild>
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {!token && !studentToken ? (
                <Button
                  variant="outline"
                  className="rounded-xl text-sm"
                  asChild
                >
                  <a href="#apply">
                    Start Tenant Application
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
              ) : null}
            </div>

            {!token && !studentToken ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                <span>
                  Admin access lives in the secondary path below. Participant
                  sign-in remains the primary route.
                </span>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {metricCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm"
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
