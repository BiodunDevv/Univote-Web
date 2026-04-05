"use client";

import Link from "next/link";
import { ArrowLeft, Compass, LifeBuoy, SearchX } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

function getPrimaryAction(input: {
  adminToken: string | null;
  adminRole: string | undefined;
  studentToken: string | null;
}) {
  if (input.adminToken) {
    return input.adminRole === "super_admin"
      ? {
          href: "/super-admin",
          label: "Return to platform console",
        }
      : {
          href: "/dashboard",
          label: "Return to admin dashboard",
        };
  }

  if (input.studentToken) {
    return {
      href: "/students/home",
      label: "Return to student dashboard",
    };
  }

  return {
    href: "/",
    label: "Return to Univote home",
  };
}

function getSecondaryAction(input: {
  adminToken: string | null;
  adminRole: string | undefined;
  studentToken: string | null;
}) {
  if (input.adminToken) {
    return {
      href: "/auth/signin",
      label: "Open admin sign in",
    };
  }

  if (input.studentToken) {
    return {
      href: "/students/profile",
      label: "Open student profile",
    };
  }

  return {
    href: "/students/login",
    label: "Open student login",
  };
}

export default function NotFound() {
  const { token: adminToken, admin, hasHydrated: adminHydrated } = useAuthStore();
  const { token: studentToken, hasHydrated: studentHydrated } =
    useStudentAuthStore();

  const primaryAction = getPrimaryAction({
    adminToken,
    adminRole: admin?.role,
    studentToken,
  });
  const secondaryAction = getSecondaryAction({
    adminToken,
    adminRole: admin?.role,
    studentToken,
  });
  const authReady = adminHydrated && studentHydrated;

  return (
    <main className="relative flex h-screen min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

      <Card className="relative h-full w-full overflow-hidden rounded-none border-0 bg-card/95 shadow-none backdrop-blur md:h-[100svh] md:border-border/70 md:shadow-2xl">
        <CardContent className="grid h-full gap-0 p-0 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col justify-between gap-8">
            <div className="space-y-5 px-5 pb-8 pt-8 sm:px-8 lg:px-12 lg:pt-12">
              <Logo className="w-fit" />

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <SearchX className="h-3.5 w-3.5" />
                Page not found
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  This Univote page is unavailable or no longer exists.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  The link may be outdated, the route may have changed, or this
                  page may only be available inside a specific university
                  workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-5 pb-8 sm:flex-row sm:px-8 lg:px-12 lg:pb-12">
              <Button
                asChild
                size="lg"
                className="rounded-2xl"
                disabled={!authReady}
              >
                <Link href={primaryAction.href}>
                  <Compass className="mr-2 h-4 w-4" />
                  {authReady ? primaryAction.label : "Checking your workspace..."}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl"
                disabled={!authReady}
              >
                <Link href={secondaryAction.href}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {authReady ? secondaryAction.label : "Preparing recovery path..."}
                </Link>
              </Button>
            </div>
          </section>

          <aside className="flex h-full items-center border-t border-border/70 bg-muted/25 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-10">
            <div className="mx-auto w-full max-w-xl space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Next steps
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Try one of the most common recovery paths below.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    University workspace route
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    If you were trying to access a tenant admin page, return to
                    the correct university subdomain and sign in again.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Student portal access
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Student routes are available from the dedicated student
                    login flow and will redirect into the right dashboard if
                    you are already signed in.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Need help?
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      If this page should exist, go back to your last working
                      screen and continue from there, or contact your
                      university’s Univote administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}
