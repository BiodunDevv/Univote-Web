"use client";

import { Pie, PieChart, Cell } from "recharts";
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
import { StudentsByCollegeItem } from "@/components/dashboard/shared/types";

type StudentsByCollegeChartProps = {
  data: StudentsByCollegeItem[];
  chartConfig: ChartConfig;
  participantPluralLabel?: string;
  dimensionLabel?: string;
};

export function StudentsByCollegeChart({
  data,
  chartConfig,
  participantPluralLabel = "Students",
  dimensionLabel = "College",
}: StudentsByCollegeChartProps) {
  const totalParticipants = data.reduce(
    (sum, item) => sum + Number(item.students || 0),
    0,
  );

  return (
    <Card className="min-w-0 overflow-hidden border shadow-none">
      <CardHeader>
        <CardTitle className="text-base">
          {participantPluralLabel} by {dimensionLabel}
        </CardTitle>
        <CardDescription>
          {totalParticipants.toLocaleString()} tracked across visible{" "}
          {dimensionLabel.toLowerCase()} units
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              No {dimensionLabel.toLowerCase()} distribution data
            </p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-52 min-w-0 w-full sm:h-60"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  dataKey="students"
                  nameKey="college"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={74}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {data.map((item, index) => (
                    <Cell
                      key={`${item.college}-${index}`}
                      fill={item.fill || `var(--chart-${(index % 5) + 1})`}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 text-sm lg:grid-cols-2">
              {data.map((college, index) => (
                <div
                  key={college.college}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        college.fill || `var(--chart-${(index % 5) + 1})`,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {college.college}
                  </span>
                  <span className="font-medium">
                    {college.students.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
