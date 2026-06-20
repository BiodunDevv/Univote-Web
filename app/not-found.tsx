"use client";

import Link from "next/link";
import { Compass, LifeBuoy, SearchX } from "lucide-react";
import { AuthBrandMark } from "@/components/Auth/auth-brand-mark";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

function getPrimaryAction(input: {
  adminToken: string | null;
  adminRole: string | undefined;
  studentToken: string | null;
}) {
  if (input.adminToken) {
    return input.adminRole === "super_admin"
      ? { href: "/super-admin", label: "Return to platform console" }
      : { href: "/dashboard", label: "Return to admin dashboard" };
  }

  if (input.studentToken) {
    return { href: "/students/home", label: "Return to student dashboard" };
  }

  return { href: "/", label: "Return to Univote home" };
}

function getSecondaryAction(input: {
  adminToken: string | null;
  adminRole: string | undefined;
  studentToken: string | null;
}) {
  if (input.adminToken) {
    return input.adminRole === "super_admin"
      ? { href: "/super-admin/support", label: "Open support" }
      : { href: "/dashboard/support", label: "Open support" };
  }

  if (input.studentToken) {
    return { href: "/students/elections", label: "View elections" };
  }

  return { href: "/students/login", label: "Open student login" };
}

export default function NotFound() {
  const { token: adminToken, admin, hasHydrated: adminHydrated } = useAuthStore();
  const { token: studentToken, hasHydrated: studentHydrated } = useStudentAuthStore();
  const authReady = adminHydrated && studentHydrated;

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

  return (
    <AuthPageShell backHref="/" backLabel="Back to website">
        <section>
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <AuthBrandMark />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Page not found
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                This Univote route is unavailable or has moved.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
                <SearchX className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  We could not find that page.
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The link may be outdated, scoped to another university
                  workspace, or no longer available.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Button asChild disabled={!authReady}>
                <Link href={primaryAction.href}>
                  <Compass className="mr-2 h-4 w-4" />
                  {authReady ? primaryAction.label : "Checking your workspace..."}
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={!authReady}>
                <Link href={secondaryAction.href}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  {authReady ? secondaryAction.label : "Preparing recovery path..."}
                </Link>
              </Button>
            </div>

            <Separator className="my-5" />

            <p className="text-center text-xs leading-5 text-muted-foreground">
              If this page should exist, return to your last working screen or
              contact your university Univote administrator.
            </p>
          </div>
        </section>
    </AuthPageShell>
  );
}
