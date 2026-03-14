"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
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
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!student) return;
    setFullName(student.full_name || "");
    setEmail(student.email || "");
    setCollege(student.college || "none");
    setDepartment(student.department || "none");
    setLevel(student.level || "none");
    setIsActive(Boolean(student.is_active));
  }, [student]);

  const collegeOptions = overview?.colleges || [];
  const departmentOptions = useMemo(() => {
    if (!showDepartment) return [];
    if (college !== "none") {
      return collegeOptions.find((item) => item.name === college)?.departments || [];
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Edit {participantLabels.singular}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update profile details and access state without leaving the registry.
          </DialogDescription>
        </DialogHeader>

        {student ? (
          <div className="grid gap-3">
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
              <div className="space-y-1.5">
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

            {(showCollege || showDepartment || showLevel) ? (
              <div className="grid gap-3 sm:grid-cols-3">
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
            ) : null}

            <label className="flex items-center gap-2 rounded-lg border p-2 text-sm">
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              Active account
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleSubmit()} disabled={updateParticipant.isPending}>
                {updateParticipant.isPending ? (
                  <LoadingButtonContent label="Saving changes..." />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
