"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Building2, FileText, Hash, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChangingLoadingState, LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { TenantAccessRestricted, TenantPageHeader } from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";

const LEVELS = ["100", "200", "300", "400", "500", "600"];

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const { colleges, loading, error, fetchColleges, addDepartment } =
    useCollegeStore();
  const [collegeId, setCollegeId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [hodName, setHodName] = useState("");
  const [hodEmail, setHodEmail] = useState("");
  const [availableLevels, setAvailableLevels] = useState<string[]>([
    "100",
    "200",
    "300",
    "400",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageStructure =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["tenant.manage", "students.manage"]);
  const departmentEnabled = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );

  useEffect(() => {
    if (!hasHydrated || !token || !canManageStructure) return;
    void fetchColleges(token, true);
  }, [canManageStructure, fetchColleges, hasHydrated, token]);

  const toggleLevel = (level: string, checked: boolean) => {
    setAvailableLevels((current) => {
      if (checked) return Array.from(new Set([...current, level]));
      return current.filter((item) => item !== level);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!collegeId) {
      toast.error("Select a college before creating a department");
      return;
    }

    try {
      setIsSubmitting(true);
      await addDepartment(token, collegeId, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        hod_name: hodName.trim(),
        hod_email: hodEmail.trim(),
        available_levels: availableLevels,
        is_active: true,
      });
      toast.success("Department created");
      router.push("/dashboard/structure/departments");
    } catch (submitError) {
      toast.error("Create failed", {
        description:
          submitError instanceof Error
            ? submitError.message
            : "Failed to create department",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || !token) {
    return <ChangingLoadingState messages={["Preparing department form..."]} />;
  }

  if (!departmentEnabled || !canManageStructure) {
    return (
      <TenantAccessRestricted
        title="Department creation is restricted"
        description="Departments are disabled or your current role cannot manage university structure."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="University structure"
        icon={<Building2 className="h-5 w-5" />}
        title="Create Department"
        subtitle="Add a department under an existing college with code, contact, and level availability."
        onBack={() => router.push("/dashboard/structure/departments")}
        stats={[
          { label: "Colleges", value: colleges.length.toLocaleString() },
          { label: "Levels", value: availableLevels.length.toLocaleString() },
        ]}
      />

      {loading && colleges.length === 0 ? (
        <ChangingLoadingState messages={["Loading colleges...", "Preparing structure options..."]} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border shadow-none">
            <CardContent className="grid gap-4 p-4 md:grid-cols-2">
              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive md:col-span-2">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2 md:col-span-2">
                <Label>College</Label>
                <Select value={collegeId} onValueChange={setCollegeId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college._id} value={college._id}>
                        {college.code} · {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-name">Department name</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <Building2 />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="department-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Computer Science"
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-code">Department code</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <Hash />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="department-code"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.toUpperCase())
                    }
                    placeholder="CSC"
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hod-name">HOD name</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <UserRound />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="hod-name"
                    value={hodName}
                    onChange={(event) => setHodName(event.target.value)}
                    placeholder="Dr. Ada Lovelace"
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hod-email">HOD email</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <AtSign />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="hod-email"
                    type="email"
                    value={hodEmail}
                    onChange={(event) => setHodEmail(event.target.value)}
                    placeholder="hod@example.edu"
                  />
                </InputGroup>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department-description">Description</Label>
                <InputGroup className="h-auto">
                  <InputGroupAddon align="block-start" className="border-b">
                    <FileText />
                    Department notes
                  </InputGroupAddon>
                  <InputGroupTextarea
                    id="department-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Optional department description"
                  />
                </InputGroup>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Available levels</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {LEVELS.map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={availableLevels.includes(level)}
                        onCheckedChange={(checked) =>
                          toggleLevel(level, checked === true)
                        }
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/structure/departments")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingButtonContent label="Creating..." />
              ) : (
                "Create department"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
