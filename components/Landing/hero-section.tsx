"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Users,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { HeroIllustration } from "../HeroIllustration";

type HeroSectionProps = {
  stats?: {
    active_tenants: number;
    active_students: number;
    accepted_votes: number;
  };
};

export function HeroSection({ stats }: HeroSectionProps) {
  const {
    token,
    admin,
    hasHydrated: adminHasHydrated,
  } = useAuthStore();
  const { token: studentToken, hasHydrated: participantHasHydrated } =
    useStudentAuthStore();
  const isCheckingSession = !adminHasHydrated || !participantHasHydrated;
  const primaryHref = isCheckingSession
    ? "#"
    : token
      ? admin?.role === "super_admin"
        ? "/super-admin"
        : "/dashboard"
      : studentToken
        ? "/students/home"
        : "/students/login";
  const primaryLabel = isCheckingSession
    ? "Checking session"
    : token
      ? admin?.role === "super_admin"
        ? "Open Platform Console"
        : "Open Dashboard"
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
    <section className="relative overflow-hidden pb-12 pt-24 sm:pb-16">
      <div className="container mx-auto px-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 sm:mt-6 lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-10">
          {/* Left Content */}
          <div className="w-full lg:max-w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground shadow-sm backdrop-blur">
              <BadgeCheck className="size-3.5 text-primary" />
              University election workspace
            </div>

            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-balance text-2xl sm:text-4xl font-semibold tracking-tight text-foreground lg:leading-[1.02]">
                Elections built for universities, student unions, faculties,
                and departmental councils.
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7">
                Run secure, branded university elections with clean student
                identity rules, structured eligibility, transparent results,
                and one fast workflow for administrators and students.
              </p>
            </div>

            <div className="mt-6 hidden sm:flex flex-wrap gap-2.5 ">
              <div className="rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Built for
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Universities, colleges, departments
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Identity
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Matric number, email, department, level
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              {isCheckingSession ? (
                <>
                  <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
                  <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
                </>
              ) : (
                <>
                  <Button className="h-11 rounded-xl px-5 text-sm" asChild>
                    <Link href={primaryHref}>{primaryLabel}</Link>
                  </Button>
                </>
              )}
              {!token && !studentToken ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-5 text-sm"
                  asChild
                >
                  <a
                    href="/tenant-application"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  Student login stays simple while admin and university
                  oversight stay centralized in one fast workflow.
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
