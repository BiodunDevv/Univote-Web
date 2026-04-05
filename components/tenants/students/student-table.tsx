"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Edit,
  Eye,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { compactUi } from "@/lib/compact-ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Student } from "@/types/student";

interface StudentTableProps {
  students: Student[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  collegeId: string;
  isSuperAdmin: boolean;
  showDepartment?: boolean;
  onDelete: (id: string, name: string, matric: string) => void;
  onPageChange: (page: number) => void;
}

function getStudentInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStudentIdentifier(student: Student) {
  return (
    student.display_identifier ||
    student.matric_no ||
    student.email ||
    "No identifier"
  );
}

function isFaceEnrolled(student: Student) {
  return Boolean(
    student.has_facial_data ||
      student.face_enrollment_status === "enrolled" ||
      (student.last_face_enrolled_at && !student.last_face_enrollment_error),
  );
}

function formatEnrollmentTimestamp(date?: string | null) {
  if (!date) return "AWS face enrollment will appear here after a successful save.";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "AWS face enrollment recorded.";
  }
  return `AWS face enrolled on ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed)}.`;
}

function StudentAvatar({
  student,
  className,
}: {
  student: Student;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const enrolled = isFaceEnrolled(student);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-primary/10 text-[11px] font-semibold text-primary",
        className,
      )}
    >
      {student.photo_url && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={student.photo_url}
          alt={student.full_name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{getStudentInitials(student.full_name)}</span>
      )}
      {enrolled ? (
        <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-emerald-500 text-[9px] text-white">
          ✓
        </span>
      ) : null}
    </div>
  );
}

function StudentPreviewDrawer({
  student,
  open,
  onOpenChange,
  collegeId,
  showDepartment,
  isSuperAdmin,
  onDelete,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId: string;
  showDepartment: boolean;
  isSuperAdmin: boolean;
  onDelete: (id: string, name: string, matric: string) => void;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const showLevelField = isTenantParticipantFieldEnabled(tenant, "level");
  const showCollegeField = isTenantParticipantFieldEnabled(tenant, "college");

  if (!student) {
    return null;
  }

  const enrolled = isFaceEnrolled(student);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent className={isMobile ? "max-h-[92vh]" : "h-screen w-full sm:max-w-lg"}>
        <DrawerHeader className="border-b border-border/70">
          <div className="flex items-start gap-3">
            <StudentAvatar student={student} className="h-12 w-12 text-sm" />
            <div className="min-w-0 space-y-1">
              <DrawerTitle className="truncate text-base font-semibold">
                {student.full_name}
              </DrawerTitle>
              <p className="font-mono text-xs text-muted-foreground">
                {formatParticipantIdentifier(
                  student as unknown as Record<string, unknown>,
                  tenant,
                ) || "No identifier"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {showLevelField && student.level ? (
                  <Badge variant="secondary">Level {student.level}</Badge>
                ) : null}
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
                <Badge variant={enrolled ? "default" : "outline"}>
                  {enrolled ? "Face enrolled" : "Face pending"}
                </Badge>
                <Badge variant="outline">
                  {enrolled
                    ? "AWS ready"
                    : student.face_enrollment_status === "failed"
                      ? "Enrollment failed"
                      : "Enrollment pending"}
                </Badge>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>Profile placement</p>
              <div className="mt-2 space-y-2">
                {showCollegeField ? (
                  <div>
                    <p className={compactUi.typography.muted}>College</p>
                    <p className="text-sm font-semibold">
                      {student.college || "Not used"}
                    </p>
                  </div>
                ) : null}
                {showDepartment ? (
                  <div>
                    <p className={compactUi.typography.muted}>Department</p>
                    <p className="text-sm font-semibold">
                      {student.department || "Not used"}
                    </p>
                  </div>
                ) : null}
                {showLevelField ? (
                  <div>
                    <p className={compactUi.typography.muted}>Level</p>
                    <p className="text-sm font-semibold">
                      {student.level || "Not used"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>Contact</p>
              <div className="mt-2 flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="break-all text-sm">{student.email || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <p className={compactUi.typography.sectionTitle}>Access state</p>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {student.is_active
                  ? `${participantLabels.singular} account is active`
                  : `${participantLabels.singular} account is inactive`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {student.first_login ? "Password setup is still pending." : "Password setup completed."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background p-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                <p className={compactUi.typography.sectionTitle}>Verification</p>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {enrolled ? "Face verification enrolled" : "Face verification pending"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {enrolled
                  ? "This record can participate in face-verified voting checks."
                  : "Upload or capture a face record before strict verification is enforced."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Enrollment status:{" "}
                <span className="font-medium text-foreground">
                  {student.face_enrollment_status === "enrolled"
                    ? "Enrolled"
                    : student.face_enrollment_status === "failed"
                      ? "Failed"
                      : "Pending"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatEnrollmentTimestamp(student.last_face_enrolled_at)}
              </p>
              {student.last_face_enrollment_error ? (
                <p className="mt-2 text-xs text-destructive">
                  {student.last_face_enrollment_error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className={compactUi.typography.eyebrow}>Identifier</p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  {formatParticipantIdentifier(
                    student as unknown as Record<string, unknown>,
                    tenant,
                  ) || "No identifier"}
                </p>
              </div>
              <div>
                <p className={compactUi.typography.eyebrow}>Department code</p>
                <p className="mt-1 text-sm font-semibold">{student.department_code || "Not assigned"}</p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-border/70 bg-background sm:flex-row">
          {isSuperAdmin ? (
            <>
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => {
                  router.push(`/dashboard/structure/colleges/${collegeId}/students/${student._id}`);
                  onOpenChange(false);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Open record
              </Button>
              <Button
                className="sm:flex-1"
                onClick={() => {
                  router.push(`/dashboard/structure/colleges/${collegeId}/students/${student._id}/edit`);
                  onOpenChange(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                className="sm:flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(student._id, student.full_name, getStudentIdentifier(student));
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : null}
          <Button
            variant={isSuperAdmin ? "outline" : "default"}
            className={cn(isSuperAdmin ? "sm:flex-1" : "w-full")}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function StudentTable({
  students,
  pagination,
  collegeId,
  isSuperAdmin,
  showDepartment = false,
  onDelete,
  onPageChange,
}: StudentTableProps) {
  const router = useRouter();
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const showLevelField = isTenantParticipantFieldEnabled(tenant, "level");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const openPreview = (student: Student) => {
    setSelectedStudent(student);
    setPreviewOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden border shadow-none py-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {pagination.total.toLocaleString()}{" "}
              {participantLabels.plural.toLowerCase()}
            </span>
            <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
          </div>
          <div className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
            {students.filter((student) => student.is_active).length.toLocaleString()} visible active
          </div>
        </div>

        <div className="grid gap-2 p-3 xl:hidden">
          {students.map((student) => (
            <div
              key={student._id}
              className="rounded-xl border border-border/70 bg-background p-3 shadow-none"
            >
              <div className="flex items-start gap-3">
                <StudentAvatar student={student} className="h-10 w-10" />
                <div className="min-w-0 flex-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => openPreview(student)}
                    className="block min-w-0 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">
                      {student.full_name}
                    </p>
                    <p className="font-mono text-xs text-primary">
                      {formatParticipantIdentifier(
                        student as unknown as Record<string, unknown>,
                        tenant,
                      ) || getStudentIdentifier(student)}
                    </p>
                  </button>
                  <p className="break-all text-xs text-muted-foreground">{student.email}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {showLevelField ? (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className={compactUi.typography.eyebrow}>Level</p>
                    <p className="mt-1 text-sm font-semibold">
                      {student.level || "Not used"}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                  <p className={compactUi.typography.eyebrow}>Status</p>
                  <p className="mt-1 text-sm font-semibold">
                    {student.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {showDepartment ? <Badge variant="outline">{student.department}</Badge> : null}
                {showLevelField && student.level ? (
                  <Badge variant="secondary">Level {student.level}</Badge>
                ) : null}
                <Badge variant={student.has_facial_data ? "default" : "outline"}>
                  {student.has_facial_data ? "Face ready" : "Face pending"}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview(student)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                {isSuperAdmin ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/structure/colleges/${collegeId}/students/${student._id}/edit`)
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onDelete(student._id, student.full_name, getStudentIdentifier(student))
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden xl:block">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12">#</TableHead>
                <TableHead>{participantLabels.singular}</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Email</TableHead>
                {showDepartment ? <TableHead>Department</TableHead> : null}
                {showLevelField ? <TableHead>Level</TableHead> : null}
                <TableHead>Status</TableHead>
                {isSuperAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student._id}>
                  <TableCell className="text-muted-foreground">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar student={student} className="h-9 w-9" />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openPreview(student)}
                          className="block min-w-0 text-left"
                        >
                          <p className="truncate font-semibold text-foreground">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.has_facial_data ? "Face ready" : "Face pending"}
                          </p>
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-primary">
                    {formatParticipantIdentifier(
                      student as unknown as Record<string, unknown>,
                      tenant,
                    ) || getStudentIdentifier(student)}
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[220px] truncate text-muted-foreground">{student.email}</p>
                  </TableCell>
                  {showDepartment ? (
                    <TableCell>
                      <div className="max-w-[180px] truncate">{student.department}</div>
                    </TableCell>
                  ) : null}
                  {showLevelField ? (
                    <TableCell>
                      <Badge variant="secondary">
                        {student.level ? `Level ${student.level}` : "Not used"}
                      </Badge>
                    </TableCell>
                  ) : null}
                  <TableCell>
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
                  </TableCell>
                  {isSuperAdmin ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openPreview(student)}
                          title={`Preview ${participantLabels.singular.toLowerCase()}`}
                          className="rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            router.push(`/dashboard/structure/colleges/${collegeId}/students/${student._id}/edit`)
                          }
                          title={`Edit ${participantLabels.singular.toLowerCase()}`}
                          className="rounded-full"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            onDelete(student._id, student.full_name, getStudentIdentifier(student))
                          }
                          title={`Delete ${participantLabels.singular.toLowerCase()}`}
                          className="rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 ? (
          <TablePaginationControls
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={onPageChange}
          />
        ) : null}
      </Card>

      <StudentPreviewDrawer
        student={selectedStudent}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        collegeId={collegeId}
        showDepartment={showDepartment}
        isSuperAdmin={isSuperAdmin}
        onDelete={onDelete}
      />
    </>
  );
}
