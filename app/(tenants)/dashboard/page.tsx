"use client";

import { useState } from "react";
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
  Activity,
  BarChart3,
  Clock,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { StudentsByLevelChart } from "@/components/dashboard/students-by-level-chart";
import { StudentsByCollegeChart } from "@/components/dashboard/students-by-college-chart";
import { TopVotersCard } from "@/components/dashboard/top-voters-card";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { AdminChatOverviewCard } from "@/components/support/admin-chat-overview-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TenantPageHeader } from "@/components/tenants/shared";
import { useAdminDashboardQuery } from "@/lib/queries/admin";
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
import { getSessionStatusDotClass } from "@/components/dashboard/shared/session-status";
import { cn } from "@/lib/utils";

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

export default function DashboardWelcomePage() {
  const router = useRouter();
  const { admin, token, hasHydrated, tenant: activeTenant } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const dashboardQuery = useAdminDashboardQuery({ enabled: isAuthorized });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!hasHydrated || !token || !admin) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={["Authenticating your session…", "Verifying admin credentials…", "Preparing your workspace…"]}
      />
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={["Fetching dashboard data…", "Loading vote statistics…", "Preparing activity feed…"]}
      />
    );
  }

  if (dashboardQuery.error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-sm border shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Failed to load dashboard"}
            </p>
            <Button variant="outline" size="sm" onClick={() => void dashboardQuery.refetch()}>
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
  const recentSessions = (dashboardData?.recent_sessions as DashboardRecentSession[]) || [];
  const topVoters = (dashboardData?.top_voters as DashboardTopVoter[]) || [];
  const recentActivities = (dashboardData?.recent_activities as DashboardRecentActivity[]) || [];
  const showCollegeStructure = isTenantParticipantFieldEnabled(tenantContext, "college");
  const showLevelStructure = isTenantParticipantFieldEnabled(tenantContext, "level");

  const studentsByLevelData: StudentsByLevelItem[] =
    distributions?.students_by_level.map((item) => ({ level: `${item.level}`, students: item.count })) || [];
  const studentsByCollegeData: StudentsByCollegeItem[] =
    distributions?.students_by_college.map((item, index) => ({
      college: item.college,
      students: item.count,
      fill: `var(--color-college${index + 1})`,
    })) || [];

  const voteTrendConfig = {
    votes: { label: "Votes", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const collegeChartConfig = {
    students: { label: participantLabels.plural },
    college1: { label: "College 1", color: "var(--chart-1)" },
    college2: { label: "College 2", color: "var(--chart-2)" },
    college3: { label: "College 3", color: "var(--chart-3)" },
    college4: { label: "College 4", color: "var(--chart-4)" },
    college5: { label: "College 5", color: "var(--chart-5)" },
    college6: { label: "College 6", color: "var(--chart-1)" },
    college7: { label: "College 7", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const openSession = (sessionId: string) => router.push(`/dashboard/elections/${sessionId}`);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Dashboard"
        subtitle={`Overview of ${participantLabels.singular.toLowerCase()} readiness, election activity, and participation.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/reports")}>
              Reports
            </Button>
            <Button size="sm" onClick={() => router.push("/dashboard/elections/create")}>
              <Plus className="mr-2 h-4 w-4" />
              New election
            </Button>
          </div>
        }
        stats={[
          { label: "Participation", value: overview ? `${overview.participation_rate}%` : "0%" },
          { label: "Votes cast", value: overview?.total_votes?.toLocaleString() || "0" },
          { label: participantLabels.plural, value: overview?.total_students?.toLocaleString() || "0" },
          { label: "Active elections", value: overview?.active_sessions?.toLocaleString() || "0" },
        ]}
      />

      {dashboardQuery.isFetching ? (
        <ChangingLoadingState messages={["Refreshing data…", "Syncing metrics…"]} className="min-h-[60px]" />
      ) : null}

      {/* Row 1: Vote trend + activity | Calendar + elections */}
      <div className="grid gap-4 lg:grid-cols-[1fr_272px]">
        <div className="grid gap-4">
          {/* Vote momentum */}
          <div className="rounded-xl border">
            <div className="flex items-start justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Voting momentum</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Daily vote volume over the active schedule.</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Live
              </div>
            </div>
            <div className="p-4">
              <ChartContainer config={voteTrendConfig} className="h-[190px] w-full">
                <AreaChart accessibilityLayer data={dashboardData?.vote_trend || []}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="votes"
                    stroke="var(--color-votes)"
                    fill="var(--color-votes)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Recent activity</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            {recentActivities.length > 0 ? (
              <div className="divide-y">
                {recentActivities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted/30">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground capitalize">
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {activity.user_name} · {activity.user_type}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <CalendarWidget
            currentMonth={currentMonth}
            onPreviousMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            recentSessions={recentSessions}
            onOpenSession={openSession}
          />

          {/* Recent elections */}
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Recent elections</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            {recentSessions.length > 0 ? (
              <div className="divide-y">
                {recentSessions.slice(0, 5).map((session) => (
                  <button
                    key={session._id}
                    type="button"
                    onClick={() => openSession(session._id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", getSessionStatusDotClass(session.status))} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{session.title}</p>
                      <p className="text-[11px] capitalize text-muted-foreground">
                        {session.status} · {formatSessionDate(session.start_time)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {session.vote_count}v
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No elections found</p>
            )}
          </div>

          <AdminChatOverviewCard />
        </div>
      </div>

      {/* Row 2: Distribution charts + top voters */}
      {(showLevelStructure || showCollegeStructure) ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_272px]">
          <div className="grid gap-4">
            {showLevelStructure ? (
              <StudentsByLevelChart
                data={studentsByLevelData}
                participantPluralLabel={participantLabels.plural}
                dimensionLabel="Access level"
              />
            ) : null}
            {showCollegeStructure ? (
              <StudentsByCollegeChart
                data={studentsByCollegeData}
                chartConfig={collegeChartConfig}
                participantPluralLabel={participantLabels.plural}
                dimensionLabel="College"
              />
            ) : null}
          </div>
          <TopVotersCard
            topVoters={topVoters}
            participantPluralLabel={participantLabels.plural}
            tenant={tenantContext}
          />
        </div>
      ) : (
        <TopVotersCard
          topVoters={topVoters}
          participantPluralLabel={participantLabels.plural}
          tenant={tenantContext}
        />
      )}
    </div>
  );
}
