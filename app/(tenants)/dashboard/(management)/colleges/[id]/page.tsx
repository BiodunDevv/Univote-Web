"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  Edit,
  GraduationCap,
  Mail,
  Plus,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { DeleteDepartmentDialog } from "@/components/tenants/departments/delete-department-dialog";
import { EditCollegeModal } from "@/components/tenants/colleges/Modals";
import { DepartmentCard } from "@/components/tenants/colleges/shared";
import {
  hasTenantPermission,
  TenantEmptyState,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminCollegeDetailQuery,
  useAdminCollegeDetailStatsQuery,
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useUpdateCollegeMutation,
} from "@/lib/queries/admin";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

const LEVEL_OPTIONS = ["100", "200", "300", "400", "500", "600"];

type DepartmentDraft = {
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
};

const initialDepartmentDraft = (): DepartmentDraft => ({
  name: "",
  code: "",
  description: "",
  hod_name: "",
  hod_email: "",
  available_levels: ["100", "200", "300", "400"],
});

export default function CollegeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const collegeId = params.id;
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);

  const isAuthorized = hasHydrated && Boolean(token);
  const canManageCollege =
    admin?.role === "super_admin" ||
    hasTenantPermission(membership?.permissions, [
      "tenant.manage",
      "students.manage",
    ]);

  const detailQuery = useAdminCollegeDetailQuery(collegeId, {
    enabled: isAuthorized,
  });
  const detailStatsQuery = useAdminCollegeDetailStatsQuery(collegeId, {
    enabled: isAuthorized,
  });
  const updateCollege = useUpdateCollegeMutation(collegeId);
  const createDepartment = useCreateDepartmentMutation(collegeId);
  const deleteDepartment = useDeleteDepartmentMutation(collegeId);

  const currentCollege = detailQuery.data?.college;
  const detailStats = detailStatsQuery.data;

  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [draftDepartment, setDraftDepartment] = useState<DepartmentDraft>(
    initialDepartmentDraft(),
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace(
        `/auth/signin?ref=${encodeURIComponent(`/dashboard/structure/colleges/${collegeId}`)}`,
      );
    }
  }, [collegeId, hasHydrated, router, token]);

  const headerStats = useMemo(
    () => [
      {
        label: "Departments",
        value: (detailStats?.total_departments ?? currentCollege?.departments.length ?? 0).toLocaleString(),
      },
      {
        label: participantLabels.plural,
        value: (detailStats?.total_students ?? currentCollege?.student_count ?? 0).toLocaleString(),
      },
      {
        label: `Active ${participantLabels.plural.toLowerCase()}`,
        value: (detailStats?.active_students ?? 0).toLocaleString(),
      },
      {
        label: "Status",
        value: currentCollege?.is_active ? "Active" : "Inactive",
      },
    ],
    [currentCollege?.departments.length, currentCollege?.is_active, currentCollege?.student_count, detailStats?.active_students, detailStats?.total_departments, detailStats?.total_students],
  );

  const departmentRollup = useMemo(
    () =>
      new Map(
        (detailStats?.departments ?? []).map((department) => [
          department.department_id,
          department,
        ]),
      ),
    [detailStats?.departments],
  );

  const handleToggleLevel = (level: string) => {
    setDraftDepartment((current) => ({
      ...current,
      available_levels: current.available_levels.includes(level)
        ? current.available_levels.filter((value) => value !== level)
        : [...current.available_levels, level].sort(),
    }));
  };

  const handleCreateDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await createDepartment.mutateAsync({
        ...draftDepartment,
        code: draftDepartment.code.toUpperCase(),
      });
      toast.success("Department added");
      setDraftDepartment(initialDepartmentDraft());
      setShowAddDepartment(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add department",
      );
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      await deleteDepartment.mutateAsync(departmentToDelete.id);
      toast.success("Department deleted");
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete department",
      );
    }
  };

  if (!hasHydrated || detailQuery.isLoading) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Loading college workspace...",
          "Assembling department coverage...",
          "Preparing structure details...",
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

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-4 p-2">
      <TenantPageHeader
        eyebrow="Tenant structure"
        icon={<Building2 className="h-5 w-5" />}
        title={currentCollege.name}
        subtitle={
          currentCollege.description ||
          `Review department coverage, dean details, and ${participantLabels.singular.toLowerCase()} distribution across this college.`
        }
        onBack={() => router.push("/dashboard/structure/colleges")}
        badges={
          <>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {currentCollege.code}
            </span>
            <span
              className={
                currentCollege.is_active
                  ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"
                  : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
              }
            >
              {currentCollege.is_active ? "Active" : "Inactive"}
            </span>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() =>
                router.push(
                  `/dashboard/participants?college_id=${encodeURIComponent(collegeId)}&ref=${encodeURIComponent(`/dashboard/structure/colleges/${collegeId}`)}`,
                )
              }
              >
                <Users className="mr-2 h-4 w-4" />
              {`View ${participantLabels.plural}`}
            </Button>
            {canManageCollege ? (
              <Button
                size="sm"
                className="h-10"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit College
              </Button>
            ) : null}
          </>
        }
        stats={headerStats}
      />

      <main className="space-y-4">
        {detailQuery.error instanceof Error ? (
          <Card className="rounded-[1.75rem] border-destructive/40 bg-destructive/5 shadow-none">
            <CardContent className="flex items-start gap-3 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{detailQuery.error.message}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.5fr_minmax(0,1fr)]">
          <TenantSectionCard
            title="College profile"
            description="Core academic identity, dean contact details, and operational state."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField
                label="College code"
                value={currentCollege.code}
                icon={<Building2 className="h-4 w-4" />}
              />
              <DetailField
                label="Operational state"
                value={currentCollege.is_active ? "Active" : "Inactive"}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <DetailField
                label="Dean"
                value={currentCollege.dean_name || "Not assigned"}
                icon={<User className="h-4 w-4" />}
              />
              <DetailField
                label="Dean email"
                value={currentCollege.dean_email || "Not provided"}
                icon={<Mail className="h-4 w-4" />}
              />
            </div>
          </TenantSectionCard>

          <TenantSectionCard
            title="Distribution snapshot"
            description={`Quick read on ${participantLabels.singular.toLowerCase()} spread across departments and levels.`}
          >
            <div className="space-y-3">
              {(detailStats?.departments ?? []).slice(0, 4).map((department) => (
                <div
                  key={department.department_id}
                  className="rounded-2xl border border-border/70 bg-muted/15 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {department.department_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {department.department_code} • {department.total_students.toLocaleString()} {participantLabels.plural.toLowerCase()}
                      </p>
                    </div>
                    <span className="rounded-full bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {department.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {Object.keys(department.level_distribution).length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(department.level_distribution).map(
                        ([level, count]) => (
                          <span
                            key={`${department.department_id}-${level}`}
                            className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                          >
                            {level}: {count}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {`No ${participantLabels.plural.toLowerCase()} enrolled yet.`}
                    </p>
                  )}
                </div>
              ))}
              {detailStatsQuery.error instanceof Error ? (
                <p className="text-xs text-muted-foreground">
                  Detailed distribution could not be loaded right now.
                </p>
              ) : null}
            </div>
          </TenantSectionCard>
        </div>

        <TenantSectionCard
          title="Departments"
          description={`Move into department-level editing and ${participantLabels.singular.toLowerCase()} drill-down without leaving the tenant shell.`}
          action={
            canManageCollege ? (
              <Button
                size="sm"
                className="h-10"
                onClick={() => setShowAddDepartment((current) => !current)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {showAddDepartment ? "Close Form" : "Add Department"}
              </Button>
            ) : null
          }
        >
          <div className="space-y-4">
            {showAddDepartment ? (
              <Card className="rounded-[1.5rem] border border-border/70 bg-muted/15 shadow-none">
                <CardContent className="p-3">
                  <form className="space-y-4" onSubmit={handleCreateDepartment}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="department-name" className="text-xs">
                          Department name
                        </Label>
                        <Input
                          id="department-name"
                          value={draftDepartment.name}
                          onChange={(event) =>
                            setDraftDepartment((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="department-code" className="text-xs">
                          Department code
                        </Label>
                        <Input
                          id="department-code"
                          value={draftDepartment.code}
                          onChange={(event) =>
                            setDraftDepartment((current) => ({
                              ...current,
                              code: event.target.value.toUpperCase(),
                            }))
                          }
                          required
                          maxLength={5}
                          className="uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="department-description" className="text-xs">
                        Description
                      </Label>
                      <Input
                        id="department-description"
                        value={draftDepartment.description}
                        onChange={(event) =>
                          setDraftDepartment((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="department-hod-name" className="text-xs">
                          HOD name
                        </Label>
                        <Input
                          id="department-hod-name"
                          value={draftDepartment.hod_name}
                          onChange={(event) =>
                            setDraftDepartment((current) => ({
                              ...current,
                              hod_name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="department-hod-email" className="text-xs">
                          HOD email
                        </Label>
                        <Input
                          id="department-hod-email"
                          type="email"
                          value={draftDepartment.hod_email}
                          onChange={(event) =>
                            setDraftDepartment((current) => ({
                              ...current,
                              hod_email: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Available levels</Label>
                      <div className="flex flex-wrap gap-2">
                        {LEVEL_OPTIONS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleToggleLevel(level)}
                            className={
                              draftDepartment.available_levels.includes(level)
                                ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                                : "rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
                            }
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddDepartment(false);
                          setDraftDepartment(initialDepartmentDraft());
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createDepartment.isPending}>
                        {createDepartment.isPending
                          ? "Adding department..."
                          : "Save Department"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {currentCollege.departments.length === 0 ? (
              <TenantEmptyState
                icon={GraduationCap}
                title="No departments yet"
                description={`Create the first department so ${participantLabels.singular.toLowerCase()} intake, level coverage, and reporting can be organized correctly.`}
                action={
                  canManageCollege
                    ? {
                        label: "Add Department",
                        onClick: () => setShowAddDepartment(true),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {currentCollege.departments.map((department) => {
                  const rollup = departmentRollup.get(department._id);

                  return (
                    <div key={department._id} className="space-y-2">
                      <DepartmentCard
                        department={department}
                        showActions={canManageCollege}
                        onViewStudents={() =>
                          router.push(
                            `/dashboard/structure/colleges/${collegeId}/departments/${department._id}/students`,
                          )
                        }
                        onViewDetails={() =>
                          router.push(
                            `/dashboard/structure/colleges/${collegeId}/departments/${department._id}/students`,
                          )
                        }
                        onEdit={
                          canManageCollege
                            ? () =>
                                router.push(
                                  `/dashboard/structure/colleges/${collegeId}/departments/${department._id}/edit`,
                                )
                            : undefined
                        }
                        onDelete={
                          canManageCollege
                            ? () => {
                                setDepartmentToDelete({
                                  id: department._id,
                                  name: department.name,
                                  code: department.code,
                                });
                                setDeleteModalOpen(true);
                              }
                            : undefined
                        }
                      />
                      {rollup ? (
                        <div className="rounded-2xl border border-border/70 bg-muted/10 p-3">
                          <p className="text-xs font-medium text-foreground">
                            Enrollment breakdown
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(rollup.level_distribution).length ? (
                              Object.entries(rollup.level_distribution).map(
                                ([level, count]) => (
                                  <span
                                    key={`${department._id}-${level}`}
                                    className="rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                                  >
                                    {level}: {count}
                                  </span>
                                ),
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No level distribution yet.
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TenantSectionCard>
      </main>

      <DeleteDepartmentDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={() => void handleDeleteDepartment()}
        departmentName={departmentToDelete?.name}
        departmentCode={departmentToDelete?.code}
        isDeleting={deleteDepartment.isPending}
      />

      <EditCollegeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        college={currentCollege}
        isSubmitting={updateCollege.isPending}
        submitError={
          updateCollege.error instanceof Error ? updateCollege.error.message : null
        }
        onSave={async (payload) => {
          try {
            await updateCollege.mutateAsync(payload);
            toast.success("College updated");
            setEditModalOpen(false);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to update college",
            );
          }
        }}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
