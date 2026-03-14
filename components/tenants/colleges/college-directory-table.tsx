"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
import type { College } from "@/components/tenants/colleges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="min-w-0">
      {colleges.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
          {colleges.map((college) => (
            <div
              key={college._id}
              className="rounded-xl border border-border/70 bg-background p-3 shadow-none"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {college.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-primary">{college.code}</p>
                </div>
                <Badge variant={college.is_active ? "default" : "secondary"}>
                  {college.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {college.description || "No description provided."}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Dean
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {college.dean_name || "Not assigned"}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {college.dean_email || "No dean email"}
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Departments
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {college.departments.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {participantPluralLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {college.student_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(college._id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                {canManageColleges ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onEdit(college)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(college)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
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
