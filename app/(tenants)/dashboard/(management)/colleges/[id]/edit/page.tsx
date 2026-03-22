"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Building2, Mail, User } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminCollegeDetailQuery,
  useAdminCollegeDetailStatsQuery,
  useUpdateCollegeMutation,
} from "@/lib/queries/admin";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

type CollegeFormState = {
  name: string;
  code: string;
  description: string;
  dean_name: string;
  dean_email: string;
  is_active: boolean;
};

export default function EditCollegePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const collegeId = params.id;
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);

  const isAuthorized = hasHydrated && Boolean(token);
  const canManageCollege =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["tenant.manage", "students.manage"]);

  const detailQuery = useAdminCollegeDetailQuery(collegeId, {
    enabled: isAuthorized,
  });
  const detailStatsQuery = useAdminCollegeDetailStatsQuery(collegeId, {
    enabled: isAuthorized,
  });
  const updateCollege = useUpdateCollegeMutation(collegeId);
  const currentCollege = detailQuery.data?.college;

  const [formState, setFormState] = useState<CollegeFormState>({
    name: "",
    code: "",
    description: "",
    dean_name: "",
    dean_email: "",
    is_active: true,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace(
        `/auth/signin?ref=${encodeURIComponent(`/dashboard/structure/colleges/${collegeId}/edit`)}`,
      );
    }
  }, [collegeId, hasHydrated, router, token]);

  useEffect(() => {
    if (!currentCollege) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- this form needs fetched server values before editing begins.
    setFormState({
      name: currentCollege.name,
      code: currentCollege.code,
      description: currentCollege.description || "",
      dean_name: currentCollege.dean_name || "",
      dean_email: currentCollege.dean_email || "",
      is_active: currentCollege.is_active,
    });
  }, [currentCollege]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateCollege.mutateAsync(formState);
      toast.success("College updated");
      router.push(`/dashboard/structure/colleges/${collegeId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save college",
      );
    }
  };

  if (!hasHydrated || detailQuery.isLoading) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Loading college editor...",
          "Pulling structure details...",
          "Preparing the edit workspace...",
        ]}
      />
    );
  }

  if (!currentCollege) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 items-center justify-center p-2">
        <Card className="w-full max-w-md rounded-[1.75rem] border shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="text-sm font-semibold text-foreground">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "College not found"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/structure/colleges")}
              >
                Back to Colleges
              </Button>
              <Button onClick={() => void detailQuery.refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageCollege) {
    return (
      <TenantAccessRestricted
        title="College editing is restricted"
        description="Your current university role can review structure, but only managers can update college configuration. Ask your workspace owner for structure management access if you need to make changes."
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-4 p-2">
      <TenantPageHeader
        eyebrow="University structure"
        icon={<Building2 className="h-5 w-5" />}
        title="Edit College"
        subtitle="Update naming, dean details, and operating state without leaving the tenant workspace."
        onBack={() => router.push(`/dashboard/structure/colleges/${collegeId}`)}
        badges={
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {currentCollege.code}
          </span>
        }
        stats={[
          {
            label: "Departments",
            value: (
              detailStatsQuery.data?.total_departments ??
              currentCollege.departments.length
            ).toLocaleString(),
          },
          {
            label: "Students",
            value: (
              detailStatsQuery.data?.total_students ??
              currentCollege.student_count
            ).toLocaleString(),
          },
          {
            label: "Active students",
            value: (
              detailStatsQuery.data?.active_students ?? 0
            ).toLocaleString(),
          },
          {
            label: "Current status",
            value: currentCollege.is_active ? "Active" : "Inactive",
          },
        ]}
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TenantSectionCard
          title="College identity"
          description="These fields shape how the college appears across student management, reporting, and session eligibility."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                College name
              </Label>
              <Input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs">
                College code
              </Label>
              <Input
                id="code"
                name="code"
                value={formState.code}
                onChange={handleInputChange}
                required
                maxLength={10}
                className="uppercase"
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              rows={4}
              className="resize-none"
            />
          </div>
        </TenantSectionCard>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
          <TenantSectionCard
            title="Dean contact"
            description="Use institutional contacts that can be referenced by support or academic operations."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dean_name" className="text-xs">
                  Dean name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dean_name"
                    name="dean_name"
                    value={formState.dean_name}
                    onChange={handleInputChange}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dean_email" className="text-xs">
                  Dean email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dean_email"
                    name="dean_email"
                    type="email"
                    value={formState.dean_email}
                    onChange={handleInputChange}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </TenantSectionCard>

          <TenantSectionCard
            title="Access state"
            description="Control whether this college remains selectable in active tenant operations."
          >
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/10 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  College active
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Disable to keep the record while preventing new operational
                  use.
                </p>
              </div>
              <Switch
                checked={formState.is_active}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
              />
            </div>
          </TenantSectionCard>
        </div>

        {updateCollege.error instanceof Error ? (
          <Card className="rounded-[1.75rem] border-destructive/40 bg-destructive/5 shadow-none">
            <CardContent className="flex items-start gap-3 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{updateCollege.error.message}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/structure/colleges/${collegeId}`)
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateCollege.isPending}>
            {updateCollege.isPending ? "Saving changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
