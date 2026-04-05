"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Building2,
  Fingerprint,
  LayoutDashboard,
  ShieldCheck,
  Vote,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { StudentsByLevelChart } from "@/components/dashboard/students-by-level-chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { StudentsByCollegeChart } from "@/components/dashboard/students-by-college-chart";
import { TopVotersCard } from "@/components/dashboard/top-voters-card";
import { RecentActivitiesCard } from "@/components/dashboard/recent-activities-card";
import { RecentSessionsCard } from "@/components/dashboard/recent-sessions-card";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { AdminChatOverviewCard } from "@/components/support/admin-chat-overview-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import {
  useAdminBiometricMetricsQuery,
  useAdminDashboardQuery,
} from "@/lib/queries/admin";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
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
  const { admin, token, hasHydrated, tenant: activeTenant } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const dashboardQuery = useAdminDashboardQuery({ enabled: isAuthorized });
  const biometricMetricsQuery = useAdminBiometricMetricsQuery(
    {},
    { enabled: isAuthorized },
  );
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
            <Button
              variant="outline"
              onClick={() => void dashboardQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardData = dashboardQuery.data;
  const tenantContext = activeTenant || dashboardData?.tenant || null;
  const participantLabels = getTenantParticipantLabels(tenantContext);
  const overview = dashboardData?.overview as DashboardOverview | undefined;
  const distributions = dashboardData?.distributions;
  const recentSessions =
    (dashboardData?.recent_sessions as DashboardRecentSession[]) || [];
  const topVoters = (dashboardData?.top_voters as DashboardTopVoter[]) || [];
  const recentActivities =
    (dashboardData?.recent_activities as DashboardRecentActivity[]) || [];
  const showCollegeStructure = isTenantParticipantFieldEnabled(
    tenantContext,
    "college",
  );
  const showDepartmentStructure = isTenantParticipantFieldEnabled(
    tenantContext,
    "department",
  );
  const showLevelStructure = isTenantParticipantFieldEnabled(
    tenantContext,
    "level",
  );
  const structureDimensionLabel = "College";
  const levelDimensionLabel = "Access level";

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
  const voteTrendConfig = {
    votes: {
      label: "Votes",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const collegeChartConfig = {
    students: {
      label: participantLabels.plural,
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
          `Calculating ${participantLabels.singular.toLowerCase()} metrics...`,
          "Preparing activity feed...",
        ]}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 p-0">
      <TenantPageHeader
        eyebrow="Tenant operations"
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Operational dashboard"
        subtitle={`Track ${participantLabels.singular.toLowerCase()} readiness, election activity, turnout momentum, and recent actions from one workspace.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/reports")}
            >
              Reports
            </Button>
            <Button onClick={() => router.push("/dashboard/sessions/create")}>
              New session
            </Button>
          </div>
        }
        stats={[
          {
            label: "Participation",
            value: overview ? `${overview.participation_rate}%` : "0%",
          },
          {
            label: "Votes",
            value: overview?.total_votes?.toLocaleString() || "0",
          },
          {
            label: participantLabels.plural,
            value: overview?.total_students?.toLocaleString() || "0",
          },
          {
            label: "Active sessions",
            value: overview?.active_sessions?.toLocaleString() || "0",
          },
        ]}
      />

      <div className="space-y-3">
        {dashboardQuery.isFetching ? (
          <ChangingLoadingState
            messages={[
              "Refreshing dashboard data...",
              "Syncing turnout metrics...",
            ]}
            className="min-h-[110px]"
          />
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[1.12fr_0.88fr]">
          <TenantSectionCard
            title="Participation landscape"
            description={
              showLevelStructure
                ? `Readiness by ${levelDimensionLabel.toLowerCase()} and a quick view into the current ${participantLabels.singular.toLowerCase()} session schedule.`
                : `Current ${participantLabels.singular.toLowerCase()} readiness and a quick view into the session schedule.`
            }
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Live refresh
              </div>
            }
          >
            <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
              {showLevelStructure ? (
                <StudentsByLevelChart
                  data={studentsByLevelData}
                  participantPluralLabel={participantLabels.plural}
                  dimensionLabel={levelDimensionLabel}
                />
              ) : (
                <Card className="border shadow-none">
                  <CardContent className="flex h-full min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3 text-muted-foreground">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">
                        Structure insights are streamlined
                      </p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        This workspace is not organizing{" "}
                        {participantLabels.plural.toLowerCase()} by level, so the
                        operational focus stays on sessions, turnout, and recent
                        activity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Voting momentum
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Daily vote volume across the active university schedule.
                    </p>
                  </div>
                  <ChartContainer
                    config={voteTrendConfig}
                    className="h-[240px] w-full"
                  >
                    <AreaChart accessibilityLayer data={dashboardData?.vote_trend || []}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={42} />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area
                        type="monotone"
                        dataKey="votes"
                        stroke="var(--color-votes)"
                        fill="var(--color-votes)"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TenantSectionCard>
          <div className="grid auto-rows-fr gap-3">
            <CalendarWidget
              currentMonth={currentMonth}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              recentSessions={recentSessions}
              onOpenSession={openSession}
            />
            <AdminChatOverviewCard />
          </div>
        </div>

        <TenantSectionCard
          title="Coverage and engagement"
          description={
            showCollegeStructure
              ? `See where ${participantLabels.singular.toLowerCase()} density lives across visible colleges and who is consistently participating across sessions.`
              : `Track participation consistency and engagement across recent sessions.`
          }
        >
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr]">
            {showCollegeStructure ? (
              <StudentsByCollegeChart
                data={studentsByCollegeData}
                chartConfig={collegeChartConfig}
                participantPluralLabel={participantLabels.plural}
                dimensionLabel={structureDimensionLabel}
              />
            ) : null}
            <TopVotersCard
              topVoters={topVoters}
              participantPluralLabel={participantLabels.plural}
              tenant={tenantContext}
            />
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Recent movement"
          description="Stay on top of administrative activity and the latest configured or active sessions."
        >
          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <RecentActivitiesCard activities={recentActivities} />
            <RecentSessionsCard
              sessions={recentSessions}
              onOpenSession={openSession}
            />
          </div>
        </TenantSectionCard>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[1.75rem] border border-border/70 shadow-none">
            <CardContent className="flex items-center gap-3 p-2">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Biometric accuracy
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {`${((biometricMetricsQuery.data?.metrics.summary.accuracy || 0) * 100).toFixed(1)}%`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-border/70 shadow-none">
            <CardContent className="flex items-center gap-3 p-2">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2">
                <Vote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Avg votes / session
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {overview?.avg_votes_per_session?.toLocaleString?.() ||
                    overview?.avg_votes_per_session ||
                    0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-border/70 shadow-none">
            <CardContent className="flex items-center gap-3 p-2">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  New {participantLabels.plural.toLowerCase()}
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {overview?.new_students_7days?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          {showCollegeStructure ? (
            <Card className="rounded-[1.75rem] border border-border/70 shadow-none">
              <CardContent className="flex items-center gap-3 p-2">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-2">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Colleges
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {overview?.total_colleges?.toLocaleString() || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
