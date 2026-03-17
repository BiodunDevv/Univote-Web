"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
import type { College } from "@/components/tenants/colleges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CollegeDirectoryTableProps = {
  colleges: College[];
  canManageColleges: boolean;
  participantPluralLabel?: string;
  onView: (collegeId: string) => void;
  onEdit: (college: College) => void;
  onDelete: (college: College) => void;
};

export function CollegeDirectoryTable({
  colleges,
  canManageColleges,
  participantPluralLabel = "Participants",
  onView,
  onEdit,
  onDelete,
}: CollegeDirectoryTableProps) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      {colleges.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {colleges.map((college) => (
            <Card
              key={college._id}
              className="rounded-xl border border-border/70 shadow-none"
            >
              <CardContent className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {college.name}
                    </p>
                    <p className="font-mono text-xs text-primary">
                      {college.code}
                    </p>
                  </div>
                  <Badge variant={college.is_active ? "default" : "secondary"}>
                    {college.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="truncate">
                    Dean: {college.dean_name || "Not assigned"}
                  </p>
                  <p className="truncate">
                    {college.dean_email || "No dean email"}
                  </p>
                  <p>
                    {college.departments.length.toLocaleString()} departments
                  </p>
                  <p>
                    {college.student_count.toLocaleString()}{" "}
                    {participantPluralLabel.toLowerCase()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(college._id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {canManageColleges ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(college)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(college)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
          No colleges matched the current filters.
        </div>
      )}
    </div>
  );
}
