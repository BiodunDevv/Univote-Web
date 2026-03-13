"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { Kbd } from "@/components/ui/kbd";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  sessions: "Sessions",
  create: "Create",
  edit: "Edit",
  colleges: "Colleges",
  admins: "Admins",
  settings: "Settings",
  "audit-logs": "Audit Logs",
  "facepp-test": "Face++ Testing",
  analytics: "Analytics",
  reports: "Reports",
  notifications: "Notifications",
  integrations: "Integrations",
  students: "Students",
  candidates: "Candidates",
  departments: "Departments",
  permissions: "Permissions",
  "election-analytics": "Election Analytics",
  "system-health": "System Health",
};

function titleFromSegment(segment: string, previous?: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  if (/^[a-f0-9]{20,}$/i.test(segment) || /^[a-f0-9-]{8,}$/i.test(segment)) {
    if (previous === "sessions") return "Session Details";
    if (previous === "admins") return "Admin Details";
    if (previous === "colleges") return "College Details";
    if (previous === "students") return "Student Details";
    if (previous === "candidates") return "Candidate Details";
    if (previous === "departments") return "Department Details";
    return "Details";
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardShellHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");
  const trail =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex) : ["dashboard"];
  const currentSegment = trail[trail.length - 1] ?? "dashboard";
  const currentTitle = titleFromSegment(
    currentSegment,
    trail[trail.length - 2],
  );

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="shrink-0 rounded-lg border border-border/70 bg-background shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground md:hidden">
              {currentTitle}
            </p>
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                {trail.map((segment, index) => {
                  const href = `/${trail.slice(0, index + 1).join("/")}`;
                  const label = titleFromSegment(segment, trail[index - 1]);
                  const isLast = index === trail.length - 1;

                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={href}>{label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground md:flex">
            <span>Search</span>
            <Kbd>/</Kbd>
          </div>
          <AnimatedThemeToggler
            variant="header"
            enableShortcut
            className="max-w-full"
          />
        </div>
      </div>
    </header>
  );
}
