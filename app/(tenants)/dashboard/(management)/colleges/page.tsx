"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Search, AlertCircle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteDepartmentDialog } from "@/components/tenants/departments/delete-department-dialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import {
  CreateCollegeModal,
  EditCollegeModal,
} from "@/components/tenants/colleges/Modals";
import type {
  College,
  CollegeCreationFormData,
} from "@/components/tenants/colleges";
import { CollegeDirectoryTable } from "@/components/tenants/colleges/college-directory-table";
import { CollegeOverviewChart } from "@/components/tenants/colleges/college-overview-chart";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";
import {
  TenantPageHeader,
  TenantSectionCard,
  hasTenantPermission,
} from "@/components/tenants/shared";

export default function CollegesPage() {
  const router = useRouter();
  const { token, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const departmentEnabled = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );
  const {
    colleges,
    statistics,
    loading,
    error,
    fetchColleges,
    fetchStatistics,
    deleteCollege,
    createCollege,
    addDepartment,
    updateCollege,
    clearError,
  } = useCollegeStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [collegeToDelete, setCollegeToDelete] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [collegeToEdit, setCollegeToEdit] = useState<College | null>(null);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const canManageColleges =
    admin?.role === "super_admin" ||
    hasTenantPermission(membership?.permissions, [
      "tenant.manage",
      "students.manage",
    ]);

  const structureDisabled = !collegeEnabled && !departmentEnabled;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchColleges(), fetchStatistics()]);
      setInitialLoad(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredColleges = colleges.filter((college) => {
    const matchesSearch =
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && college.is_active) ||
      (statusFilter === "inactive" && !college.is_active);

    return matchesSearch && matchesStatus;
  });
  const pageSize = 20;
  const pagination = useMemo(() => {
    const total = filteredColleges.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return {
      total,
      pages,
      page: Math.min(page, pages),
      limit: pageSize,
    };
  }, [filteredColleges.length, page]);

  const visibleColleges = useMemo(() => {
    const start = (pagination.page - 1) * pageSize;
    return filteredColleges.slice(start, start + pageSize);
  }, [filteredColleges, pagination.page]);

  useEffect(() => {
    if (page > pagination.pages) {
      setPage(pagination.pages);
    }
  }, [page, pagination.pages]);

  const collegeChartData = filteredColleges
    .slice()
    .sort((left, right) => right.student_count - left.student_count)
    .slice(0, 6)
    .map((college) => ({
      name: college.code,
      students: college.student_count,
      departments: college.departments.length,
    }));

  const handleDeleteClick = (
    collegeId: string,
    collegeName: string,
    collegeCode: string,
  ) => {
    setCollegeToDelete({ id: collegeId, name: collegeName, code: collegeCode });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collegeToDelete || !token) return;

    setIsDeleting(true);
    try {
      // Use force=true to delete college and all its students
      await deleteCollege(token, collegeToDelete.id, true);
      setDeleteModalOpen(false);
      setCollegeToDelete(null);
      await fetchColleges();
    } catch {
      // Error handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCollege = async (formData: CollegeCreationFormData) => {
    if (!token) return;

    setIsCreateSubmitting(true);
    clearError();

    try {
      const createdCollege = await createCollege(token, {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        dean_name: formData.dean_name,
        dean_email: formData.dean_email,
      });

      if (formData.departments.length > 0) {
        await Promise.all(
          formData.departments.map((department) =>
            addDepartment(token, createdCollege._id, {
              name: department.name,
              code: department.code,
              description: department.description,
              hod_name: department.hod_name,
              hod_email: department.hod_email,
              available_levels: department.available_levels,
            }),
          ),
        );
      }

      setCreateModalOpen(false);
      await Promise.all([fetchColleges(), fetchStatistics()]);
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleEditClick = (college: College) => {
    setCollegeToEdit(college);
    clearError();
    setEditModalOpen(true);
  };

  const handleEditCollege = async (data: {
    name: string;
    code: string;
    description: string;
    dean_name: string;
    dean_email: string;
    is_active: boolean;
  }) => {
    if (!token || !collegeToEdit) return;

    setIsEditSubmitting(true);
    clearError();

    try {
      await updateCollege(token, collegeToEdit._id, data);
      setEditModalOpen(false);
      setCollegeToEdit(null);
      await Promise.all([fetchColleges(), fetchStatistics()]);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (structureDisabled) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-2">
          <TenantSectionCard
            title="Structure is disabled"
            description="This tenant is currently operating without college and department structure. Enable structure fields in settings to manage university units."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/settings?tab=profile")}
              >
                Open settings
              </Button>
              <Button onClick={() => router.push("/dashboard/students")}>
                View Students
              </Button>
            </div>
          </TenantSectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-2">
        <TenantPageHeader
          eyebrow="University structure"
          icon={<Building2 className="h-5 w-5" />}
          title="Colleges & Departments"
          subtitle="Manage college records, review student coverage, and move into department-level operations from one registry."
          actions={
            canManageColleges ? (
              <Button
                onClick={() => {
                  clearError();
                  setCreateModalOpen(true);
                }}
                size="sm"
                className="h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create College
              </Button>
            ) : undefined
          }
          stats={[
            {
              label: "Colleges",
              value: statistics?.total_colleges?.toLocaleString() || "0",
            },
            ...(departmentEnabled
              ? [
                  {
                    label: "Departments",
                    value:
                      statistics?.total_departments?.toLocaleString() || "0",
                  },
                ]
              : []),
            {
              label: "Students",
              value: statistics?.total_students?.toLocaleString() || "0",
            },
            {
              label: "Active",
              value: statistics?.active_colleges?.toLocaleString() || "0",
            },
          ]}
        />

        <main className="space-y-6">
          {/* Error Message */}
          {error && (
            <aside className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </aside>
          )}

          <div>
            <TenantSectionCard
              title="College distribution"
              description="Compare student population and department count across currently visible colleges."
              action={
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Filter-aware chart
                </div>
              }
            >
              <CollegeOverviewChart
                data={collegeChartData}
                participantPluralLabel="Students"
              />
            </TenantSectionCard>
          </div>

          {/* Filters */}
          <TenantSectionCard
            title="Filter colleges"
            description="Search by college name or code and switch between active and inactive records without leaving the registry."
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search colleges by name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 bg-background pl-9 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("all");
                    setPage(1);
                  }}
                  size="sm"
                  className="h-10 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("active");
                    setPage(1);
                  }}
                  size="sm"
                  className="h-10 text-xs"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("inactive");
                    setPage(1);
                  }}
                  size="sm"
                  className="h-10 text-xs"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </TenantSectionCard>

          {/* Loading State */}
          {(loading || initialLoad) && colleges.length === 0 && (
            <ChangingLoadingState
              messages={[
                "Loading colleges...",
                "Fetching university statistics...",
                "Preparing college directory...",
              ]}
            />
          )}

          <TenantSectionCard
            title="College registry"
            description="Review every visible college in compact operational cards, then drill into detail pages for departments and students."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {visibleColleges.length} of {filteredColleges.length}
              </div>
            }
            contentClassName="overflow-hidden"
          >
            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <CollegeDirectoryTable
                colleges={visibleColleges}
                canManageColleges={canManageColleges}
                participantPluralLabel="Students"
                onView={(collegeId) =>
                  router.push(`/dashboard/structure/colleges/${collegeId}`)
                }
                onEdit={handleEditClick}
                onDelete={(college) =>
                  handleDeleteClick(college._id, college.name, college.code)
                }
              />
            </div>

            {pagination.pages > 1 ? (
              <Card className="mt-3 border shadow-none">
                <CardContent className="p-0">
                  <TablePaginationControls
                    page={pagination.page}
                    pages={pagination.pages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(nextPage) =>
                      setPage(Math.max(1, Math.min(pagination.pages, nextPage)))
                    }
                  />
                </CardContent>
              </Card>
            ) : null}
          </TenantSectionCard>

          {/* Empty State */}
          {!loading && !initialLoad && filteredColleges.length === 0 && (
            <section aria-label="No Results">
              <Card className="border shadow-none">
                <CardContent className="p-8">
                  <div className="text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">
                      No colleges found
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by creating your first college"}
                    </p>
                    {canManageColleges &&
                      !searchQuery &&
                      statusFilter === "all" && (
                        <Button
                          onClick={() => {
                            clearError();
                            setCreateModalOpen(true);
                          }}
                          className="h-9"
                        >
                          <Plus className="w-3.5 h-3.5 mr-2" />
                          Create College
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteDepartmentDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        departmentName={collegeToDelete?.name}
        departmentCode={collegeToDelete?.code}
        isDeleting={isDeleting}
      />

      <CreateCollegeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreateCollege}
        isSubmitting={isCreateSubmitting}
        submitError={error}
      />

      <EditCollegeModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setCollegeToEdit(null);
          }
        }}
        college={collegeToEdit}
        onSave={handleEditCollege}
        isSubmitting={isEditSubmitting}
        submitError={error}
      />
    </div>
  );
}
