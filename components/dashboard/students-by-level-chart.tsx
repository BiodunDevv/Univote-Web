"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { StudentsByLevelItem } from "@/components/dashboard/shared/types";

type StudentsByLevelChartProps = {
  data: StudentsByLevelItem[];
  participantPluralLabel?: string;
  dimensionLabel?: string;
};

const chartConfig = {
  students: {
    label: "Students",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function StudentsByLevelChart({
  data,
  participantPluralLabel = "Students",
  dimensionLabel = "Level",
}: StudentsByLevelChartProps) {
  const normalizedDimensionLabel =
    dimensionLabel && dimensionLabel.trim() ? dimensionLabel : "Level";

  return (
    <Card className="border shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">
          {participantPluralLabel} by {normalizedDimensionLabel}
        </CardTitle>
        <CardDescription>
          {participantPluralLabel} distribution across configured{" "}
          {normalizedDimensionLabel.toLowerCase()} bands
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-60 items-center justify-center rounded-md border border-dashed sm:h-72">
            <p className="text-sm text-muted-foreground">
              No {normalizedDimensionLabel.toLowerCase()} data available
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-60 w-full sm:h-72">
            <AreaChart
              data={data}
              accessibilityLayer
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="level"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label) =>
                      `${normalizedDimensionLabel} ${label}`
                    }
                    formatter={(value) =>
                      `${Number(value).toLocaleString()} ${participantPluralLabel.toLowerCase()}`
                    }
                  />
                }
              />
              <defs>
                <linearGradient
                  id="fillStudentsByLevel"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-students)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-students)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="students"
                type="natural"
                fill="url(#fillStudentsByLevel)"
                stroke="var(--color-students)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
