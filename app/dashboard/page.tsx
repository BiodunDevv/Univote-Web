"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  Vote,
  Building2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar as CalendarIcon,
  Activity,
  Clock,
  Trophy,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/College/PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function DashboardWelcomePage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  const { dashboardData, isLoading, fetchDashboardData } = useDashboardStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.push("/auth/signin");
    }
  }, [token, router, isHydrated]);

  useEffect(() => {
    if (isHydrated && token) {
      fetchDashboardData(token);
    }
  }, [isHydrated, token, fetchDashboardData]);

  if (!isHydrated || !token || !admin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const today = currentDate.getDate();
  const isCurrentMonth =
    currentMonth.getMonth() === currentDate.getMonth() &&
    currentMonth.getFullYear() === currentDate.getFullYear();

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  // Get overview data
  const overview = dashboardData?.overview;
  const distributions = dashboardData?.distributions;
  const recentSessions = dashboardData?.recent_sessions || [];
  const topVoters = dashboardData?.top_voters || [];
  const recentActivities = dashboardData?.recent_activities || [];

  // Prepare chart data
  const studentsByLevelData =
    distributions?.students_by_level.map((item) => ({
      level: `${item.level}`,
      students: item.count,
    })) || [];

  const studentsByCollegeData =
    distributions?.students_by_college.map((item, index) => ({
      college: item.college,
      students: item.count,
      fill: `var(--color-college${index + 1})`,
    })) || [];

  // Chart configs
  const levelChartConfig = {
    students: {
      label: "Students",
      color: "var(--chart-1)",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig;

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

  // Map sessions to calendar dates
  const getSessionsForDate = (day: number) => {
    return recentSessions.filter((session) => {
      const sessionDate = new Date(session.start_time);
      return (
        sessionDate.getDate() === day &&
        sessionDate.getMonth() === currentMonth.getMonth() &&
        sessionDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const hasSessionOnDate = (day: number) => {
    return getSessionsForDate(day).length > 0;
  };

  const handleDateClick = (day: number) => {
    const sessions = getSessionsForDate(day);
    if (sessions.length > 0) {
      // Navigate to the first session on that date
      router.push(`/dashboard/sessions/${sessions[0]._id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${admin.full_name}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="flex"
            onClick={() => router.push("/dashboard/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto p-2 space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Students */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {overview?.total_students || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Vote className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {overview?.active_sessions || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Sessions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Colleges */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {overview?.total_colleges || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Colleges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Departments */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {overview?.total_departments || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Calendar Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Students by Level Chart */}
          <Card className="lg:col-span-2 border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Students by Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={levelChartConfig}>
                <BarChart
                  accessibilityLayer
                  data={studentsByLevelData}
                  layout="vertical"
                  margin={{
                    right: 16,
                  }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="level"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value}
                    hide
                  />
                  <XAxis dataKey="students" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="students"
                    layout="vertical"
                    fill="var(--color-students)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="level"
                      position="insideLeft"
                      offset={8}
                      className="fill-white"
                      fontSize={12}
                    />
                    <LabelList
                      dataKey="students"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Calendar Widget */}
          <Card className="border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Calendar</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {monthName} {year}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <TooltipProvider>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-4">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="py-1.5 font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-1.5"></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = isCurrentMonth && day === today;
                    const hasSessions = hasSessionOnDate(day);
                    const sessionsOnDate = getSessionsForDate(day);

                    const dateElement = (
                      <div
                        onClick={() => handleDateClick(day)}
                        className={`py-1.5 rounded-full transition-colors relative ${
                          isToday
                            ? "bg-primary text-primary-foreground font-semibold cursor-pointer"
                            : hasSessions
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                            : "hover:bg-accent cursor-default"
                        }`}
                      >
                        {day}
                        {hasSessions && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {sessionsOnDate.slice(0, 3).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-1 w-1 rounded-full bg-current"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );

                    return hasSessions ? (
                      <Tooltip key={day}>
                        <TooltipTrigger asChild>{dateElement}</TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            {sessionsOnDate.map((session, idx) => (
                              <div key={idx} className="text-xs">
                                <p className="font-medium">{session.title}</p>
                                <p className="text-muted-foreground">
                                  {session.status === "active"
                                    ? "🟢"
                                    : session.status === "upcoming"
                                    ? "🔵"
                                    : "⚪"}{" "}
                                  {session.status}
                                </p>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground italic mt-2">
                              Click to view session details
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={day}>{dateElement}</div>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Upcoming Sessions */}
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Upcoming Sessions
                </p>
                {recentSessions
                  .filter(
                    (s) => s.status === "upcoming" || s.status === "active"
                  )
                  .slice(0, 3).length > 0 ? (
                  recentSessions
                    .filter(
                      (s) => s.status === "upcoming" || s.status === "active"
                    )
                    .slice(0, 3)
                    .map((session) => (
                      <div
                        key={session._id}
                        onClick={() =>
                          router.push(`/dashboard/sessions/${session._id}`)
                        }
                        className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            session.status === "active"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="flex-1 truncate font-medium">
                          {session.title}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No upcoming sessions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* College Distribution & Top Voters */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* College Distribution Chart */}
          <Card className="lg:col-span-2 border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Students by College</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={collegeChartConfig}
                className="mx-auto aspect-square max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={studentsByCollegeData}
                    dataKey="students"
                    label
                    nameKey="college"
                  />
                </PieChart>
              </ChartContainer>

              {/* College Legend with Numbers */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {studentsByCollegeData.map((college, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: college.fill }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{college.college}</p>
                      <p className="text-muted-foreground">
                        {college.students} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Voters List */}
          <Card className="border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Top Voters</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVoters.length > 0 ? (
                  topVoters.map((voter, index) => (
                    <div
                      key={voter.matric_no}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {voter.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {voter.matric_no}
                        </p>
                      </div>
                      <div className="text-xs font-medium">
                        {voter.votes_cast} votes
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No votes recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities & Sessions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activities */}
          <Card className="lg:col-span-2 border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-muted p-2">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.user_name} ({activity.user_type})
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <div
                      key={session._id}
                      onClick={() =>
                        router.push(`/dashboard/sessions/${session._id}`)
                      }
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          session.status === "active"
                            ? "bg-green-500"
                            : session.status === "upcoming"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {session.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground capitalize">
                          {session.status}
                        </p>
                      </div>
                      <div className="text-xs font-medium">
                        {session.vote_count} votes
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
