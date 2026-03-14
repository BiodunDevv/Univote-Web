"use client";

import {
  IconEdit,
  IconEye,
  IconTrash,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { StudentsRegistryTableProps } from "./types";

function getStudentIdentifier(student: {
  display_identifier?: string | null;
  matric_no?: string | null;
  member_id?: string | null;
  employee_id?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  return (
    student.display_identifier ||
    student.member_id ||
    student.employee_id ||
    student.username ||
    student.matric_no ||
    student.email ||
    "No identifier"
  );
}

export function StudentsRegistryTable({
  students,
  selectedIds,
  canManageStudents,
  participantSingularLabel = "Participant",
  showCollegeField = true,
  showDepartmentField = true,
  showLevelField = true,
  onToggleAll,
  allVisibleSelected,
  onToggleOne,
  onView,
  onEdit,
  onMarkActive,
  onMarkInactive,
  onDelete,
  onPreviewImage,
}: StudentsRegistryTableProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{students.length} visible students</span>
          <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
            {selectedIds.length} selected
          </span>
        </div>
        {canManageStudents ? (
          <label className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={onToggleAll}
              aria-label="Select all visible students"
            />
            Select visible
          </label>
        ) : null}
      </div>

      {students.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
          {students.map((student) => {
            const initials = student.full_name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={student._id}
                className="rounded-xl border border-border/70 bg-background p-3 shadow-none"
              >
                <div className="flex items-start gap-3">
                  {canManageStudents ? (
                    <Checkbox
                      checked={selectedIds.includes(student._id)}
                      onCheckedChange={(checked) =>
                        onToggleOne(student._id, checked === true)
                      }
                      aria-label={`Select ${student.full_name}`}
                      className="mt-1"
                    />
                  ) : null}

                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                    type="button"
                    onClick={() => {
                      if (!student.photo_url) return;
                      onPreviewImage({
                        url: student.photo_url,
                        fullName: student.full_name,
                        identifier: getStudentIdentifier(student),
                      });
                    }}
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 p-0.5"
                    >
                      {student.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="h-full w-full rounded-sm object-contain"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-sm text-[10px] font-semibold text-muted-foreground">
                          {initials}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {student.full_name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-primary">
                            {getStudentIdentifier(student)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            student.is_active
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                              : "border-border bg-muted/60 text-muted-foreground"
                          }
                        >
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </div>

                {showCollegeField || showDepartmentField ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {showCollegeField ? (
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          College
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">
                          {student.college || "Not used"}
                        </p>
                      </div>
                    ) : null}
                    {showDepartmentField ? (
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Department
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">
                          {student.department || "Not used"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {showLevelField ? (
                    <Badge variant="secondary">Level {student.level || "Not set"}</Badge>
                  ) : null}
                  <Badge variant={student.has_facial_data ? "default" : "outline"}>
                    {student.has_facial_data ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Face ready
                      </>
                    ) : (
                      "Face pending"
                    )}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(student._id)}>
                    <IconEye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {student.photo_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onPreviewImage({
                          url: student.photo_url!,
                          fullName: student.full_name,
                          identifier: getStudentIdentifier(student),
                        })
                      }
                    >
                      Preview image
                    </Button>
                  ) : null}
                  {canManageStudents ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onEdit(student._id)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {student.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkInactive(student._id)}
                        >
                          <IconUserX className="mr-2 h-4 w-4" />
                          Inactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkActive(student._id)}
                        >
                          <IconUserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => onDelete(student._id)}>
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
          No {participantSingularLabel.toLowerCase()} records found.
        </div>
      )}
    </div>
  );
}
