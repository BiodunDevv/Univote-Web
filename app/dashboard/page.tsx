"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ChartConfig } from "@/components/ui/chart";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { StudentsByLevelChart } from "@/components/dashboard/students-by-level-chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { StudentsByCollegeChart } from "@/components/dashboard/students-by-college-chart";
import { TopVotersCard } from "@/components/dashboard/top-voters-card";
import { RecentActivitiesCard } from "@/components/dashboard/recent-activities-card";
import { RecentSessionsCard } from "@/components/dashboard/recent-sessions-card";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminDashboardQuery } from "@/lib/queries/admin";
import {
  DashboardOverview,
  DashboardRecentActivity,
  DashboardRecentSession,
  DashboardTopVoter,
  StudentsByCollegeItem,
  StudentsByLevelItem,
} from "@/components/dashboard/shared/types";

export default function DashboardWelcomePage() {
  const router = useRouter();
  const { admin, token, hasHydrated } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const dashboardQuery = useAdminDashboardQuery({ enabled: isAuthorized });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/auth/signin");
    }
  }, [token, router, hasHydrated]);

  if (!hasHydrated || !token || !admin) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Authenticating your session...",
          "Verifying admin credentials...",
          "Preparing your workspace...",
        ]}
      />
    );
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  if (dashboardQuery.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Failed to load dashboard"}
            </p>
            <Button variant="outline" onClick={() => void dashboardQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardData = dashboardQuery.data;
  const overview = dashboardData?.overview as DashboardOverview | undefined;
  const distributions = dashboardData?.distributions;
  const recentSessions =
    (dashboardData?.recent_sessions as DashboardRecentSession[]) || [];
  const topVoters = (dashboardData?.top_voters as DashboardTopVoter[]) || [];
  const recentActivities =
    (dashboardData?.recent_activities as DashboardRecentActivity[]) || [];

  // Prepare chart data
  const studentsByLevelData: StudentsByLevelItem[] =
    distributions?.students_by_level.map((item) => ({
      level: `${item.level}`,
      students: item.count,
    })) || [];

  const studentsByCollegeData: StudentsByCollegeItem[] =
    distributions?.students_by_college.map((item, index) => ({
      college: item.college,
      students: item.count,
      fill: `var(--color-college${index + 1})`,
    })) || [];

  const collegeChartConfig = {
    students: {
      label: "Students",
    },
    college1: { label: "College 1", color: "var(--chart-1)" },
    college2: { label: "College 2", color: "var(--chart-2)" },
    college3: { label: "College 3", color: "var(--chart-3)" },
    college4: { label: "College 4", color: "var(--chart-4)" },
    college5: { label: "College 5", color: "var(--chart-5)" },
    college6: { label: "College 6", color: "var(--chart-1)" },
    college7: { label: "College 7", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const openSession = (sessionId: string) => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  if (dashboardQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Fetching dashboard data...",
          "Loading vote statistics...",
          "Calculating student metrics...",
          "Preparing activity feed...",
        ]}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2 p-0">
      <div className="space-y-2">
        {dashboardQuery.isFetching ? (
          <ChangingLoadingState
            messages={[
              "Refreshing dashboard data...",
              "Syncing turnout metrics...",
            ]}
            className="min-h-[120px]"
          />
        ) : null}

        <MetricsGrid overview={overview} />

        <div className="grid gap-2 lg:grid-cols-3">
          <StudentsByLevelChart data={studentsByLevelData} />
          <CalendarWidget
            currentMonth={currentMonth}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            recentSessions={recentSessions}
            onOpenSession={openSession}
          />
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          <StudentsByCollegeChart
            data={studentsByCollegeData}
            chartConfig={collegeChartConfig}
          />
          <TopVotersCard topVoters={topVoters} />
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          <RecentActivitiesCard activities={recentActivities} />
          <RecentSessionsCard
            sessions={recentSessions}
            onOpenSession={openSession}
          />
        </div>
      </div>
    </div>
  );
}
