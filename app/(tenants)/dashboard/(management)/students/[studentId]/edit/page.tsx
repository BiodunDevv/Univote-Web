"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AtSign,
  GraduationCap,
  Hash,
  ImageIcon,
  Loader2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import { TenantAccessRestricted, TenantPageHeader } from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  type AdminStudentsOverview,
  useAdminStudentDetailQuery,
  useAdminStudentsOverviewQuery,
  useUpdateStudentMutation,
} from "@/lib/queries/admin";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import type { Student } from "@/types/student";
import type { TenantContext } from "@/types/tenant";

type StudentEditFormProps = {
  student: Student;
  overview: AdminStudentsOverview | null;
  studentId: string;
  tenant: TenantContext | null;
};

function StudentEditForm({
  student,
  overview,
  studentId,
  tenant,
}: StudentEditFormProps) {
  const router = useRouter();
  const participantLabels = getTenantParticipantLabels(tenant);
  const updateStudent = useUpdateStudentMutation(studentId);
  const showEmail = isTenantParticipantFieldEnabled(tenant, "email");
  const showCollege = isTenantParticipantFieldEnabled(tenant, "college");
  const showDepartment = isTenantParticipantFieldEnabled(tenant, "department");
  const showLevel = isTenantParticipantFieldEnabled(tenant, "level");
  const showPhoto = isTenantParticipantFieldEnabled(tenant, "photo_url");

  const [fullName, setFullName] = useState(student.full_name || "");
  const [email, setEmail] = useState(student.email || "");
  const [college, setCollege] = useState(student.college || "none");
  const [department, setDepartment] = useState(student.department || "none");
  const [level, setLevel] = useState(student.level || "none");
  const [photoUrl, setPhotoUrl] = useState(student.photo_url || "");
  const [isActive, setIsActive] = useState(Boolean(student.is_active));
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const collegeOptions = useMemo(
    () => overview?.colleges || [],
    [overview?.colleges],
  );
  const departmentOptions = useMemo(() => {
    if (!showDepartment) return [];
    if (college !== "none") {
      return collegeOptions.find((item) => item.name === college)?.departments || [];
    }
    return collegeOptions.flatMap((item) => item.departments);
  }, [college, collegeOptions, showDepartment]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateStudent.mutateAsync({
        full_name: fullName.trim(),
        email: showEmail ? email.trim().toLowerCase() : undefined,
        college: showCollege ? (college === "none" ? "" : college) : undefined,
        department: showDepartment
          ? department === "none"
            ? ""
            : department
          : undefined,
        level: showLevel ? (level === "none" ? "" : level) : undefined,
        photo_url: showPhoto ? photoUrl.trim() : undefined,
        is_active: isActive,
      });
      toast.success(`${participantLabels.singular} updated`);
      router.push("/dashboard/students");
    } catch (error) {
      toast.error("Update failed", {
        description:
          error instanceof Error
            ? error.message
            : `Failed to update ${participantLabels.singular.toLowerCase()}`,
      });
    }
  };

  const handlePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Upload a valid image file");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const url = await uploadImageToCloudinary(file, "univote/students");
      setPhotoUrl(url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error("Photo upload failed", {
        description:
          error instanceof Error ? error.message : "Unable to upload image",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Student registry"
        icon={<GraduationCap className="h-5 w-5" />}
        title={`Edit ${participantLabels.singular}`}
        subtitle="Update identity, structure, photo, and access status for this student."
        onBack={() => router.push("/dashboard/students")}
        stats={[
          { label: "Status", value: isActive ? "Active" : "Inactive" },
          { label: "Identifier", value: student.display_identifier || student.matric_no || "—" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="student-name">Full name</Label>
              <InputGroup>
                <InputGroupAddon>
                  <UserRound />
                </InputGroupAddon>
                <InputGroupInput
                  id="student-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </InputGroup>
            </div>

            {showEmail ? (
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <AtSign />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="student-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </InputGroup>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Identifier</Label>
              <InputGroup data-disabled="true">
                <InputGroupAddon>
                  <Hash />
                </InputGroupAddon>
                <InputGroupInput
                  value={student.display_identifier || student.matric_no || ""}
                  disabled
                  readOnly
                />
              </InputGroup>
            </div>

            {showCollege ? (
              <div className="space-y-2">
                <Label>College</Label>
                <Select
                  value={college}
                  onValueChange={(value) => {
                    setCollege(value);
                    setDepartment("none");
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {collegeOptions.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {showDepartment ? (
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {departmentOptions.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {showLevel ? (
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {(overview?.levels || []).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {showPhoto ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student-photo">Profile photo</Label>
                <div className="grid gap-3 rounded-md border bg-muted/10 p-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-md border bg-background">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={`${student.full_name} preview`}
                        className="aspect-square h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {photoUrl ? "Photo ready" : "No photo uploaded"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload an image or paste a direct image URL. Saving the record stores the current photo.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto}
                        onClick={() =>
                          document.getElementById("student-photo-file")?.click()
                        }
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload image
                          </>
                        )}
                      </Button>
                      {photoUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhotoUrl("")}
                        >
                          Remove photo
                        </Button>
                      ) : null}
                    </div>
                    <input
                      id="student-photo-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={(event) =>
                        void handlePhotoUpload(event.target.files?.[0])
                      }
                    />
                  </div>
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <ImageIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="student-photo"
                    value={photoUrl}
                    onChange={(event) => setPhotoUrl(event.target.value)}
                    placeholder="https://"
                  />
                </InputGroup>
              </div>
            ) : null}

            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm md:col-span-2">
              <Checkbox
                checked={isActive}
                onCheckedChange={(value) => setIsActive(value === true)}
              />
              <span>Active account</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/students")}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateStudent.isPending || isUploadingPhoto}>
            {updateStudent.isPending ? (
              <LoadingButtonContent label="Saving..." />
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditStudentPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const canManageStudents =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["students.manage", "tenant.manage"]);

  const detailQuery = useAdminStudentDetailQuery(studentId, {
    enabled: hasHydrated && Boolean(token) && canManageStudents,
  });
  const overviewQuery = useAdminStudentsOverviewQuery({
    enabled: hasHydrated && Boolean(token) && canManageStudents,
  });

  if (!hasHydrated || !token || detailQuery.isLoading || overviewQuery.isLoading) {
    return <ChangingLoadingState messages={["Loading student record...", "Preparing edit form..."]} />;
  }

  if (!canManageStudents) {
    return (
      <TenantAccessRestricted
        title="Student editing is restricted"
        description="Your current role cannot edit student records."
      />
    );
  }

  const student = detailQuery.data?.student;

  if (!student) {
    return (
      <TenantAccessRestricted
        title="Student not found"
        description="The selected student record could not be loaded."
      />
    );
  }

  return (
    <StudentEditForm
      key={student._id}
      student={student}
      overview={overviewQuery.data ?? null}
      studentId={studentId}
      tenant={tenant}
    />
  );
}
