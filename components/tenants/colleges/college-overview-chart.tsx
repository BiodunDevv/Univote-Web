"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const collegeChartConfig = {
  students: {
    label: "Students",
    color: "var(--chart-1)",
  },
  departments: {
    label: "Departments",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type CollegeOverviewChartProps = {
  data: Array<{
    name: string;
    students: number;
    departments: number;
  }>;
  participantPluralLabel?: string;
};

export function CollegeOverviewChart({
  data,
  participantPluralLabel = "Students",
}: CollegeOverviewChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        College breakdown will appear here once records are available.
      </div>
    );
  }

  return (
    <ChartContainer
      config={{
        ...collegeChartConfig,
        students: {
          ...collegeChartConfig.students,
          label: participantPluralLabel,
        },
      }}
      className="h-60 w-full sm:h-72"
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 8, top: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 12)}
        />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="students" fill="var(--color-students)" radius={10} />
        <Bar
          dataKey="departments"
          fill="var(--color-departments)"
          radius={10}
        />
      </BarChart>
    </ChartContainer>
  );
}
