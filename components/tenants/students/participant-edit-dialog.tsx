"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

type StudentsOverviewLite = {
  colleges: Array<{
    id: string;
    name: string;
    departments: Array<{
      id: string;
      name: string;
    }>;
  }>;
  levels: string[];
};

type ParticipantEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  overview: StudentsOverviewLite | null;
  onUpdated: () => Promise<void>;
};

export function ParticipantEditDialog({
  open,
  onOpenChange,
  student,
  overview,
  onUpdated,
}: ParticipantEditDialogProps) {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const updateParticipant = useUpdateStudentMutation(student?._id || "");
  const showEmail = isTenantParticipantFieldEnabled(tenant, "email");
  const showCollege = isTenantParticipantFieldEnabled(tenant, "college");
  const showDepartment = isTenantParticipantFieldEnabled(tenant, "department");
  const showLevel = isTenantParticipantFieldEnabled(tenant, "level");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("none");
  const [department, setDepartment] = useState("none");
  const [level, setLevel] = useState("none");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

  const collegeOptions = overview?.colleges || [];
  const departmentOptions = useMemo(() => {
    if (!showDepartment) return [];
    if (college !== "none") {
      return (
        collegeOptions.find((item) => item.name === college)?.departments || []
      );
    }
    return collegeOptions.flatMap((item) => item.departments);
  }, [college, collegeOptions, showDepartment]);

  const handleSubmit = async () => {
    if (!student) return;

    try {
      await updateParticipant.mutateAsync({
        full_name: fullName,
        email: showEmail ? email : undefined,
        college: showCollege ? (college === "none" ? "" : college) : undefined,
        department: showDepartment
          ? department === "none"
            ? ""
            : department
          : undefined,
        level: showLevel ? (level === "none" ? "" : level) : undefined,
        photo_url: photoUrl || "",
        is_active: isActive,
      });
      await onUpdated();
      toast.success(`${participantLabels.singular} updated`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to update ${participantLabels.singular.toLowerCase()}`,
      );
    }
  };

  const handlePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadImageToCloudinary(file, "univote/students");
      setPhotoUrl(url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">
            {participantLabels.singular} details
          </SheetTitle>
          <SheetDescription className="text-xs">
            Review profile data, approve the submitted photo, and update access
            state without leaving the registry.
          </SheetDescription>
        </SheetHeader>

        {student ? (
          <div className="grid gap-4 px-3 pb-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1.5">
              <Label htmlFor="participant-full-name" className="text-xs">
                Full name
              </Label>
              <Input
                id="participant-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
              </div>

              {showEmail ? (
                <div className="mt-4 space-y-1.5">
                <Label htmlFor="participant-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="participant-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <Label className="text-xs">Profile image</Label>
              <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={fullName || "Student photo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No image
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    value={photoUrl}
                    onChange={(event) => setPhotoUrl(event.target.value.trim())}
                    placeholder="Paste image URL"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/70 bg-background px-3 py-1">
                      {student.photo_review_status === "approved"
                        ? "Photo approved"
                        : student.photo_review_status === "rejected"
                          ? "Photo rejected"
                          : "Photo review pending"}
                    </span>
                    {student.has_facial_data ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700">
                        Face verified
                      </span>
                    ) : (
                      <span className="rounded-full border border-border/70 bg-background px-3 py-1">
                        Face verification pending
                      </span>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted/20">
                    {isUploadingPhoto ? (
                      <LoadingButtonContent label="Uploading image..." />
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload image
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={(event) =>
                        void handlePhotoUpload(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                  {student.photo_review_status !== "approved" && photoUrl ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-fit"
                      disabled={updateParticipant.isPending}
                      onClick={async () => {
                        try {
                          await updateParticipant.mutateAsync({
                            photo_review_status: "approved",
                          });
                          await onUpdated();
                          toast.success("Student photo approved");
                          onOpenChange(false);
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to approve student photo",
                          );
                        }
                      }}
                    >
                      {updateParticipant.isPending ? (
                        <LoadingButtonContent label="Approving photo..." />
                      ) : (
                        <>
                          <BadgeCheck className="mr-2 h-4 w-4" />
                          Approve photo
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {showCollege || showDepartment || showLevel ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                {showCollege ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">College</Label>
                    <Select
                      value={college}
                      onValueChange={(value) => {
                        setCollege(value);
                        if (value === "none") {
                          setDepartment("none");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not used</SelectItem>
                        {collegeOptions.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {showDepartment ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not used</SelectItem>
                        {departmentOptions.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {showLevel ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not used</SelectItem>
                        {(overview?.levels || []).map((levelOption) => (
                          <SelectItem key={levelOption} value={levelOption}>
                            {levelOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                </div>
              </div>
            ) : null}

            <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              Active account
            </label>

            <SheetFooter className="px-0 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSubmit()}
                disabled={updateParticipant.isPending || isUploadingPhoto}
              >
                {updateParticipant.isPending ? (
                  <LoadingButtonContent label="Saving changes..." />
                ) : (
                  "Save updates"
                )}
              </Button>
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
