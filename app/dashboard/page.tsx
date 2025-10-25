"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Vote,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react";

export default function DashboardWelcomePage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
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
      id: "students",
      title: "Students",
      description: "Manage student records and voters",
      icon: Users,
      href: "/dashboard/students",
      gradient: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-600 dark:text-green-400",
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome back, {admin?.full_name}
        </h1>
        <p className="text-xs text-muted-foreground">
          {admin?.role === "super_admin"
            ? "You have full system access and administrative privileges"
            : "Manage elections and monitor voting activities"}
        </p>
      </div>

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
        <h2 className="mb-3 text-sm font-semibold">Getting Started</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Quick Start Guide */}
          <Card className="border shadow-none">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-sm font-semibold">
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <div className="space-y-2.5">
                {[
                  "Create voting sessions for campus elections",
                  "Upload student records via CSV files",
                  "Monitor real-time voting statistics",
                  "Generate comprehensive election reports",
                  ...(admin?.role === "super_admin"
                    ? ["Manage administrator accounts"]
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
  );
}
