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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {colleges.map((college) => (
            <Card
              key={college._id}
              className="h-full rounded-xl border border-border/70 shadow-none"
            >
              <CardContent className="flex h-full flex-col space-y-3 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 wrap-break-word text-sm font-semibold leading-5">
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
                  <p className="line-clamp-2 wrap-break-word">
                    Dean: {college.dean_name || "Not assigned"}
                  </p>
                  <p className="break-all">
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

                <div className="mt-auto grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
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
                        className="w-full"
                        onClick={() => onEdit(college)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
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
