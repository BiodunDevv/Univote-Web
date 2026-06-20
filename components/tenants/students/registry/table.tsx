"use client";

import {
  IconEdit,
  IconEye,
  IconMailForward,
  IconTrash,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { CheckCircle2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StudentsRegistryTableProps } from "./types";

function isFaceEnrolled(student: {
  has_facial_data?: boolean;
  face_enrollment_status?: "pending" | "failed" | "enrolled";
  last_face_enrolled_at?: string | null;
  last_face_enrollment_error?: string | null;
}) {
  return Boolean(
    student.has_facial_data ||
      student.face_enrollment_status === "enrolled" ||
      (student.last_face_enrolled_at && !student.last_face_enrollment_error),
  );
}

function getStudentIdentifier(student: {
  display_identifier?: string | null;
  matric_no?: string | null;
  email?: string | null;
}) {
  return (
    student.display_identifier ||
    student.matric_no ||
    student.email ||
    "No identifier"
  );
}

function formatCollegeLabel(
  student: {
    college?: string | null;
    college_code?: string | null;
  },
  collegeCodeMap?: Record<string, string>,
) {
  if (student.college_code) return student.college_code;
  if (student.college && collegeCodeMap?.[student.college])
    return collegeCodeMap[student.college];
  if (!student.college) return "—";
  const code = student.college
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !["of", "and", "&", "the"].includes(w.toLowerCase()))
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return code || student.college;
}

function formatDepartmentLabel(student: {
  department?: string | null;
  department_code?: string | null;
}) {
  if (student.department_code) return student.department_code;
  return student.department || "—";
}

export function StudentsRegistryTable({
  students,
  collegeCodeMap,
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
  onReinvite,
  onMarkActive,
  onMarkInactive,
  onDelete,
  onPreviewImage,
  statusActionStudentId,
  statusActionType,
}: StudentsRegistryTableProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          No {participantPluralLabel.toLowerCase()} found
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Adjust your filters or add new {participantPluralLabel.toLowerCase()} to populate the registry.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{students.length}</span>{" "}
          {participantPluralLabel.toLowerCase()} shown
          {selectedIds.length > 0 ? (
            <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
              {selectedIds.length} selected
            </span>
          ) : null}
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {canManageStudents ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={onToggleAll}
                    aria-label={`Select all ${participantPluralLabel.toLowerCase()}`}
                  />
                </TableHead>
              ) : null}
              <TableHead className="w-8 text-muted-foreground">#</TableHead>
              <TableHead>{participantSingularLabel}</TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead>Email</TableHead>
              {showCollegeField ? <TableHead>College</TableHead> : null}
              {showDepartmentField ? <TableHead>Department</TableHead> : null}
              {showLevelField ? <TableHead>Level</TableHead> : null}
              {showFaceField ? <TableHead>Face</TableHead> : null}
              <TableHead>Status</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => {
              const isActivating =
                statusActionStudentId === student._id &&
                statusActionType === "activate";
              const isDeactivating =
                statusActionStudentId === student._id &&
                statusActionType === "deactivate";
              const isReinviting =
                statusActionStudentId === student._id &&
                statusActionType === "reinvite";
              const enrolled = isFaceEnrolled(student);
              const initials = student.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <TableRow
                  key={student._id}
                  data-state={selectedIds.includes(student._id) ? "selected" : undefined}
                  className="group"
                >
                  {canManageStudents ? (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(student._id)}
                        onCheckedChange={(checked) =>
                          onToggleOne(student._id, checked === true)
                        }
                        aria-label={`Select ${student.full_name}`}
                      />
                    </TableCell>
                  ) : null}

                  <TableCell className="text-muted-foreground tabular-nums">
                    {rowStartIndex + index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-muted/40"
                        onClick={() => {
                          if (!student.photo_url || !showPhotoField) return;
                          onPreviewImage({
                            url: student.photo_url,
                            fullName: student.full_name,
                            identifier: getStudentIdentifier(student),
                          });
                        }}
                      >
                        {showPhotoField && student.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.photo_url}
                            alt={student.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                            {initials}
                          </span>
                        )}
                      </button>
                      <span className="max-w-40 truncate font-medium text-foreground">
                        {student.full_name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-primary">
                      {getStudentIdentifier(student)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="max-w-[180px] truncate text-muted-foreground">
                      {student.email || "—"}
                    </span>
                  </TableCell>

                  {showCollegeField ? (
                    <TableCell>
                      <span className="text-muted-foreground">
                        {formatCollegeLabel(student, collegeCodeMap)}
                      </span>
                    </TableCell>
                  ) : null}

                  {showDepartmentField ? (
                    <TableCell>
                      <span className="max-w-40 truncate text-muted-foreground">
                        {formatDepartmentLabel(student)}
                      </span>
                    </TableCell>
                  ) : null}

                  {showLevelField ? (
                    <TableCell>
                      <span className="text-muted-foreground">
                        {student.level || "—"}
                      </span>
                    </TableCell>
                  ) : null}

                  {showFaceField ? (
                    <TableCell>
                      {enrolled ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Enrolled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {student.face_enrollment_status === "failed"
                            ? "Failed"
                            : "Pending"}
                        </Badge>
                      )}
                    </TableCell>
                  ) : null}

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        student.is_active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted/60 text-muted-foreground"
                      }
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    {isActivating || isDeactivating || isReinviting ? (
                      <span className="text-xs text-muted-foreground">
                        {isReinviting
                          ? "Sending…"
                          : isActivating
                            ? "Activating…"
                            : "Deactivating…"}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onView(student._id)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          {canManageStudents ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => onEdit(student._id)}
                              >
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit record
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!student.email}
                                onClick={() => onReinvite(student._id)}
                              >
                                <IconMailForward className="mr-2 h-4 w-4" />
                                Reinvite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {student.is_active ? (
                                <DropdownMenuItem
                                  onClick={() => onMarkInactive(student._id)}
                                >
                                  <IconUserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onMarkActive(student._id)}
                                >
                                  <IconUserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(student._id)}
                              >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
