"use client";

import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
};

export function StudentsByCollegeChart({
  data,
  chartConfig,
}: StudentsByCollegeChartProps) {
  return (
    <Card className="border shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Students by College</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              No college distribution data
            </p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={data} dataKey="students" label nameKey="college" />
              </PieChart>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {data.map((college) => (
                <div key={college.college} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: college.fill }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{college.college}</p>
                    <p className="text-muted-foreground">
                      {college.students} students
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
