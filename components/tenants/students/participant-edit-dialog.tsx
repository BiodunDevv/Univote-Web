"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, CheckCircle2, Edit, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useUpdateStudentMutation } from "@/lib/queries/admin";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { Student } from "@/types/student";

function isFaceEnrolled(student: Student) {
  return Boolean(
    student.has_facial_data ||
      student.face_enrollment_status === "enrolled" ||
      (student.last_face_enrolled_at && !student.last_face_enrollment_error),
  );
}

function fmtDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

type StudentsOverviewLite = {
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    departments: Array<{ id: string; name: string; code: string }>;
  }>;
  levels: string[];
};

type ParticipantEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  overview: StudentsOverviewLite | null;
  onUpdated: () => Promise<void>;
  initialMode?: "view" | "edit";
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-xs text-foreground">{value || "—"}</span>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ParticipantEditDialog({
  open,
  onOpenChange,
  student,
  overview,
  onUpdated,
  initialMode = "view",
}: ParticipantEditDialogProps) {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const updateParticipant = useUpdateStudentMutation(student?._id || "");
  const showEmail = isTenantParticipantFieldEnabled(tenant, "email");
  const showCollege = isTenantParticipantFieldEnabled(tenant, "college");
  const showDepartment = isTenantParticipantFieldEnabled(tenant, "department");
  const showLevel = isTenantParticipantFieldEnabled(tenant, "level");
  const showPhoto = isTenantParticipantFieldEnabled(tenant, "photo_url");

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("none");
  const [department, setDepartment] = useState("none");
  const [level, setLevel] = useState("none");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const enrolled = student ? isFaceEnrolled(student) : false;

  useEffect(() => {
    if (!student) return;
    setFullName(student.full_name || "");
    setEmail(student.email || "");
    setCollege(student.college || "none");
    setDepartment(student.department || "none");
    setLevel(student.level || "none");
    setPhotoUrl(student.photo_url || "");
    setIsActive(Boolean(student.is_active));
  }, [student]);

  // Reset mode when dialog opens
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const collegeOptions = useMemo(() => overview?.colleges || [], [overview?.colleges]);
  const departmentOptions = useMemo(() => {
    if (!showDepartment) return [];
    if (college !== "none") return collegeOptions.find((c) => c.name === college)?.departments || [];
    return collegeOptions.flatMap((c) => c.departments);
  }, [college, collegeOptions, showDepartment]);
  const selectedCollegeCode =
    college !== "none"
      ? collegeOptions.find((item) => item.name === college)?.code
      : undefined;
  const selectedDepartmentCode =
    department !== "none"
      ? departmentOptions.find((item) => item.name === department)?.code
      : undefined;

  const handleSubmit = async () => {
    if (!student) return;
    try {
      await updateParticipant.mutateAsync({
        full_name: fullName,
        email: showEmail ? email : undefined,
        college: showCollege ? (college === "none" ? "" : college) : undefined,
        department: showDepartment ? (department === "none" ? "" : department) : undefined,
        level: showLevel ? (level === "none" ? "" : level) : undefined,
        photo_url: photoUrl || "",
        is_active: isActive,
      });
      await onUpdated();
      toast.success(`${participantLabels.singular} updated`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to update ${participantLabels.singular.toLowerCase()}`);
    }
  };

  const handlePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadImageToCloudinary(file, "univote/students");
      setPhotoUrl(url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!student) return null;

  const initials = student.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const displayId = student.display_identifier || student.matric_no || student.email || "No identifier";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0 sm:max-w-4xl lg:max-w-6xl">
        <div className="flex max-h-[92vh] flex-col overflow-hidden">
          <div className="border-b border-border/70 px-5 py-5 sm:px-6">
            <DialogHeader className="pr-10">
              <DialogTitle className="text-base font-semibold text-foreground sm:text-lg">
                {mode === "view"
                  ? `${participantLabels.singular} profile`
                  : `Edit ${participantLabels.singular.toLowerCase()}`}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/70">
                  {showPhoto && (photoUrl || student.photo_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl || student.photo_url || ""}
                      alt={student.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">
                    {student.full_name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-primary">{displayId}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={
                        student.is_active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                          : "text-muted-foreground text-[10px]"
                      }
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {student.college_code ? (
                      <Badge variant="outline" className="text-[10px]">
                        {student.college_code}
                      </Badge>
                    ) : null}
                    {student.department_code ? (
                      <Badge variant="outline" className="text-[10px]">
                        {student.department_code}
                      </Badge>
                    ) : null}
                    {enrolled ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Face enrolled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        {student.face_enrollment_status === "failed"
                          ? "Enrollment failed"
                          : "Enrollment pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {mode === "view" ? (
                  <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="shrink-0">
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit record
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setMode("view")} className="shrink-0">
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancel edit
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {mode === "view" ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                <SectionCard
                  title="Profile details"
                  description="Core identity and academic structure fields for this participant."
                >
                  <div className="divide-y rounded-xl border border-border/70">
                    <DetailRow label="Full name" value={student.full_name} />
                    {showEmail ? <DetailRow label="Email" value={student.email} /> : null}
                    {showCollege ? <DetailRow label="College" value={student.college} /> : null}
                    {showDepartment ? (
                      <DetailRow label="Department" value={student.department} />
                    ) : null}
                    {showLevel ? <DetailRow label="Level" value={student.level} /> : null}
                    <DetailRow label="Matric / ID" value={student.matric_no || student.display_identifier} />
                    <DetailRow label="Registered" value={fmtDate(student.createdAt)} />
                  </div>
                </SectionCard>

                <div className="space-y-4">
                  <SectionCard
                    title="Academic tags"
                    description="Compact structure labels used across filters and registry tables."
                  >
                    <div className="flex flex-wrap gap-2">
                      {student.college_code ? (
                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                          {student.college_code}
                        </Badge>
                      ) : null}
                      {student.department_code ? (
                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                          {student.department_code}
                        </Badge>
                      ) : null}
                      {student.level ? (
                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                          {student.level}
                        </Badge>
                      ) : null}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Biometric status"
                    description="Face enrollment and verification readiness."
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Status:{" "}
                        <span className="font-medium text-foreground capitalize">
                          {student.face_enrollment_status || "pending"}
                        </span>
                      </p>
                      {student.last_face_enrolled_at ? (
                        <p>
                          Enrolled:{" "}
                          <span className="text-foreground">
                            {fmtDate(student.last_face_enrolled_at)}
                          </span>
                        </p>
                      ) : null}
                      {student.last_face_enrollment_error ? (
                        <p className="text-destructive">
                          {student.last_face_enrollment_error}
                        </p>
                      ) : (
                        <p>Changes to the saved profile photo trigger a fresh face enrollment.</p>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.85fr)]">
                <SectionCard
                  title="Profile fields"
                  description="Update core participant identity and structure details."
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label htmlFor="pe-full-name" className="text-xs font-medium">Full name</Label>
                        <Input id="pe-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 text-sm" />
                      </div>
                      {showEmail ? (
                        <div className="space-y-1.5 lg:col-span-2">
                          <Label htmlFor="pe-email" className="text-xs font-medium">Email</Label>
                          <Input id="pe-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 text-sm" />
                        </div>
                      ) : null}
                    </div>

                    {showCollege || showDepartment || showLevel ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {showCollege ? (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">College</Label>
                            <Select value={college} onValueChange={(v) => { setCollege(v); if (v === "none") setDepartment("none"); }}>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Select college">
                                  {selectedCollegeCode || "Select college"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not set</SelectItem>
                                {collegeOptions.map((c) => <SelectItem key={c.id} value={c.name}>{c.code}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                        {showDepartment ? (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Department</Label>
                            <Select value={department} onValueChange={setDepartment}>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Select department">
                                  {selectedDepartmentCode || "Select department"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not set</SelectItem>
                                {departmentOptions.map((d) => <SelectItem key={d.id} value={d.name}>{d.code}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                        {showLevel ? (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Level</Label>
                            <Select value={level} onValueChange={setLevel}>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not set</SelectItem>
                                {(overview?.levels || []).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 px-3 py-3 text-sm">
                      <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
                      <span className="font-medium text-foreground">Active account</span>
                    </label>
                  </div>
                </SectionCard>

                <div className="space-y-4">
                  {showPhoto ? (
                    <SectionCard
                      title="Profile photo"
                      description="Photo updates will trigger automatic AWS face enrollment."
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/70">
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">No photo</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              value={photoUrl}
                              onChange={(e) => setPhotoUrl(e.target.value.trim())}
                              placeholder="Paste image URL"
                              className="h-9 text-sm"
                            />
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/70 px-3 py-2 text-xs font-medium hover:bg-muted/20">
                              {isUploadingPhoto ? (
                                <LoadingButtonContent label="Uploading…" />
                              ) : (
                                <><Upload className="h-3 w-3" />Upload image</>
                              )}
                              <input type="file" accept="image/*" className="hidden" disabled={isUploadingPhoto} onChange={(e) => void handlePhotoUpload(e.target.files?.[0])} />
                            </label>
                          </div>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BadgeCheck className="h-3 w-3 shrink-0" />
                          Saving will enqueue a fresh biometric enrollment check.
                        </p>
                      </div>
                    </SectionCard>
                  ) : null}

                  <SectionCard
                    title="Biometric status"
                    description="Current face verification readiness for this participant."
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Status:{" "}
                        <span className="font-medium text-foreground capitalize">
                          {student.face_enrollment_status || "pending"}
                        </span>
                      </p>
                      {student.last_face_enrolled_at ? (
                        <p>
                          Enrolled:{" "}
                          <span className="text-foreground">
                            {fmtDate(student.last_face_enrolled_at)}
                          </span>
                        </p>
                      ) : null}
                      {student.last_face_enrollment_error ? (
                        <p className="text-destructive">{student.last_face_enrollment_error}</p>
                      ) : null}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>

          {mode === "edit" ? (
            <div className="border-t border-border/70 px-4 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => setMode("view")} disabled={updateParticipant.isPending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => void handleSubmit()} disabled={updateParticipant.isPending || isUploadingPhoto}>
                  {updateParticipant.isPending ? <LoadingButtonContent label="Saving…" /> : "Save changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
