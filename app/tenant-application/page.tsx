import type { Metadata } from "next";
import Link from "next/link";
import { TenantApplicationSection } from "@/components/Landing/tenant-application";
import { buildPublicMetadata } from "../seo";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = buildPublicMetadata({
  title: "Apply for a University Voting Workspace",
  description:
    "Request a Univote workspace for your university and launch secure campus elections with student identity checks and live result delivery.",
  path: "/tenant-application",
  keywords: [
    "apply for university voting software",
    "campus election workspace",
    "student election platform application",
  ],
});

export default function TenantApplicationPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] dark:opacity-[0.055]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="tenant-application-dot-pattern"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tenant-application-dot-pattern)" />
      </svg>

      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to website
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6">
        <TenantApplicationSection />
      </div>
    </div>
  );
}
