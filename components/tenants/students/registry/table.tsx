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
import { Card, CardContent } from "@/components/ui/card";
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
  rowStartIndex = 0,
  selectedIds,
  canManageStudents,
  participantSingularLabel = "Student",
  participantPluralLabel = "Students",
  showCollegeField = true,
  showDepartmentField = true,
  showLevelField = true,
  showFaceField = true,
  showPhotoField = true,
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {students.length} visible {participantPluralLabel.toLowerCase()}
          </span>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {students.map((student, index) => {
            const initials = student.full_name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card
                key={student._id}
                className="h-full rounded-xl border border-border/70 shadow-none"
              >
                <CardContent className="flex h-full flex-col space-y-3 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border/70 bg-muted/20 px-1.5 text-xs font-medium text-muted-foreground">
                        {rowStartIndex + index + 1}
                      </span>
                      {canManageStudents ? (
                        <Checkbox
                          checked={selectedIds.includes(student._id)}
                          onCheckedChange={(checked) =>
                            onToggleOne(student._id, checked === true)
                          }
                          aria-label={`Select ${student.full_name}`}
                        />
                      ) : null}
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

                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!student.photo_url || !showPhotoField) return;
                        onPreviewImage({
                          url: student.photo_url,
                          fullName: student.full_name,
                          identifier: getStudentIdentifier(student),
                        });
                      }}
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40"
                    >
                      {showPhotoField && student.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {initials}
                        </span>
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {student.full_name}
                      </p>
                      <p className="truncate font-mono text-xs text-primary">
                        {getStudentIdentifier(student)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="break-all">{student.email}</p>
                    {showCollegeField ? (
                      <p className="line-clamp-2 wrap-break-word">
                        College: {student.college || "Not used"}
                      </p>
                    ) : null}
                    {showDepartmentField ? (
                      <p className="line-clamp-2 wrap-break-word">
                        Department: {student.department || "Not used"}
                      </p>
                    ) : null}
                    {showLevelField ? (
                      <p>Level: {student.level || "Not set"}</p>
                    ) : null}
                    {showFaceField ? (
                      <Badge
                        variant={
                          student.has_facial_data ? "default" : "outline"
                        }
                        className="mt-1"
                      >
                        {student.has_facial_data ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Face ready
                          </>
                        ) : (
                          "Face pending"
                        )}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onView(student._id)}
                    >
                      <IconEye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {canManageStudents ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onEdit(student._id)}
                        >
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        {student.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => onMarkInactive(student._id)}
                          >
                            <IconUserX className="mr-2 h-4 w-4" />
                            Inactive
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => onMarkActive(student._id)}
                          >
                            <IconUserCheck className="mr-2 h-4 w-4" />
                            Active
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onDelete(student._id)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
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
