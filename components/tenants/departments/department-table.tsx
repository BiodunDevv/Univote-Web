"use client";

import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type DepartmentRow = {
  _id: string;
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
  college: {
    id: string;
    name: string;
    code: string;
  };
};

type DepartmentTableProps = {
  departments: DepartmentRow[];
  participantPluralLabel?: string;
  onViewStudents: (department: DepartmentRow) => void;
};

export function DepartmentTable({
  departments,
  participantPluralLabel = "Students",
  onViewStudents,
}: DepartmentTableProps) {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{departments.length.toLocaleString()} departments loaded</span>
        <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
          {departments
            .filter((department) => department.is_active)
            .length.toLocaleString()}{" "}
          active
        </span>
      </div>

      {departments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {departments.map((department) => (
            <Card
              key={department._id}
              className="h-full rounded-xl border border-border/70 shadow-none"
            >
              <CardContent className="flex h-full flex-col space-y-3 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 wrap-break-word text-sm font-semibold leading-5">
                      {department.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {department.code}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      department.is_active
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                        : "border-border bg-muted/60 text-muted-foreground"
                    }
                  >
                    {department.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="line-clamp-2 wrap-break-word">
                    College: {department.college?.name || "Not assigned"}
                  </p>
                  <p className="line-clamp-2 wrap-break-word">
                    HOD: {department.hod_name || "Not assigned"}
                  </p>
                  <p className="break-all">
                    {department.hod_email || "No email"}
                  </p>
                  <p className="line-clamp-2">
                    Levels:{" "}
                    {department.available_levels.length > 0
                      ? department.available_levels.join(", ")
                      : "Not mapped"}
                  </p>
                  <p>
                    {department.student_count.toLocaleString()}{" "}
                    {participantPluralLabel.toLowerCase()}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onViewStudents(department)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onViewStudents(department)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {participantPluralLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
          No departments found.
        </div>
      )}
    </div>
  );
}
