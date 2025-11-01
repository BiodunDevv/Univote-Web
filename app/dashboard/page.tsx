"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Vote,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle2,
  Building2,
  TrendingUp,
  UserCheck,
  Activity,
} from "lucide-react";

export default function DashboardWelcomePage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  const { dashboardStats, getDashboardStats, loading } = useSettingsStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !token) {
      router.push("/auth/signin");
    }
  }, [token, router, isHydrated]);

  useEffect(() => {
    // Fetch dashboard stats when hydrated and token is available
    if (isHydrated && token) {
      getDashboardStats(token);
    }
  }, [isHydrated, token, getDashboardStats]);

  // Show loading while hydrating
  if (!isHydrated || !token || !admin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      id: "elections",
      title: "Elections",
      description: "Create and manage voting sessions",
      icon: Vote,
      href: "/dashboard/sessions",
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "colleges",
      title: "Colleges",
      description: "Manage colleges and departments",
      icon: Building2,
      href: "/dashboard/colleges",
      gradient: "from-indigo-500/10 to-indigo-500/5",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "reports",
      title: "Reports",
      description: "View election results and analytics",
      icon: BarChart3,
      href: "/dashboard/sessions",
      gradient: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  if (admin?.role === "super_admin") {
    quickLinks.unshift({
      id: "admin-management",
      title: "Admins",
      description: "Manage administrators and permissions",
      icon: Settings,
      href: "/dashboard/admins",
      gradient: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600 dark:text-orange-400",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3">
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-semibold tracking-tight truncate">
              Welcome back, {admin?.full_name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {admin?.role === "super_admin"
                ? "You have full system access and administrative privileges"
                : "Manage elections and monitor voting activities"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 space-y-4">
        {/* System Statistics */}
        {dashboardStats && (
          <div>
            <h2 className="mb-3 text-sm font-semibold">System Overview</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {/* Students */}
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {dashboardStats.students.total}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <UserCheck className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-muted-foreground">
                      {dashboardStats.students.active} active •{" "}
                      {dashboardStats.students.facial_registration_rate} with
                      facial data
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Colleges */}
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {dashboardStats.colleges.total}
                      </p>
                      <p className="text-xs text-muted-foreground">Colleges</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Activity className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-muted-foreground">
                      {dashboardStats.colleges.total_departments} departments
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <Vote className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {dashboardStats.sessions.total}
                      </p>
                      <p className="text-xs text-muted-foreground">Elections</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-muted-foreground">
                      {dashboardStats.sessions.active} active •{" "}
                      {dashboardStats.sessions.completed} completed
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Votes */}
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {dashboardStats.votes.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Votes
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-muted-foreground">
                      All validated votes
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Loading State for Stats */}
        {loading && !dashboardStats && (
          <div>
            <h2 className="mb-3 text-sm font-semibold">System Overview</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border shadow-none">
                  <CardContent className="p-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-20" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Cards */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Quick Access</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Card
                key={link.id}
                className="group cursor-pointer border shadow-none transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => router.push(link.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${link.gradient}`}
                    >
                      <link.icon className={`h-5 w-5 ${link.iconColor}`} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold">{link.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started Section */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">
            Key Features & Capabilities
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {/* System Features */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Vote className="h-4 w-4 text-primary" />
                  Election Management
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <div className="space-y-2.5">
                  {[
                    "Create and configure voting sessions with custom settings",
                    "Set election dates, voting hours, and geographic boundaries",
                    "Add candidates with photos, manifestos, and positions",
                    "Define eligible voter groups by college, department, or level",
                    "Location-based voting with configurable radius verification",
                    "Real-time vote counting and live result tracking",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Student & Data Management */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Student & Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <div className="space-y-2.5">
                  {[
                    "Organize students by colleges, departments, and levels",
                    "Bulk upload student data via CSV with validation",
                    "Manage student profiles with photos and credentials",
                    "Facial recognition integration for identity verification",
                    "Track voting history and participation rates",
                    "Generate detailed reports and analytics",
                    ...(admin?.role === "super_admin"
                      ? ["Full administrative control and user management"]
                      : []),
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border shadow-none">
              <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-semibold">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/dashboard/sessions")}
                    className="h-9 w-full justify-start text-sm"
                    variant="outline"
                  >
                    <Vote className="mr-2 h-3.5 w-3.5" />
                    Create New Election
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/students")}
                    className="h-9 w-full justify-start text-sm"
                    variant="outline"
                  >
                    <Users className="mr-2 h-3.5 w-3.5" />
                    Upload Students
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/sessions")}
                    className="h-9 w-full justify-start text-sm"
                    variant="outline"
                  >
                    <BarChart3 className="mr-2 h-3.5 w-3.5" />
                    View Reports
                  </Button>
                  {admin?.role === "super_admin" && (
                    <Button
                      onClick={() => router.push("/dashboard/admins")}
                      className="h-9 w-full justify-start text-sm"
                      variant="outline"
                    >
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      Manage Admins
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
