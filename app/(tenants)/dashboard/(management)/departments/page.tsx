"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  DeleteDepartmentDialog,
  DepartmentFilters,
} from "@/components/tenants/departments";
import { DepartmentTable } from "@/components/tenants/departments/department-table";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useDepartmentStore } from "@/lib/store/useDepartmentStore";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

function DepartmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = { singular: "Student", plural: "Students" };
  const departmentEnabled = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const {
    departments,
    overview,
    loading,
    error,
    fetchDepartments,
    fetchOverview,
  } = useDepartmentStore();
  const { deleteDepartment } = useCollegeStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collegeId, setCollegeId] = useState(
    searchParams.get("college_id") || "all",
  );
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<{
    id: string;
    collegeId: string;
    name: string;
    code: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageDepartments =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["tenant.manage", "students.manage"]);

  const structureDisabled = !departmentEnabled;

  useEffect(() => {
    if (!hasHydrated || !token) return;
    void Promise.all([
      fetchOverview(token),
      fetchDepartments(token, { page: 1, limit: 1000 }),
    ]);
  }, [hasHydrated, token, fetchDepartments, fetchOverview]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const nextCollegeId = searchParams.get("college_id") || "all";
    setCollegeId(nextCollegeId);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (collegeId === "all" || !overview?.colleges?.length) return;
    const collegeExists = overview.colleges.some(
      (college) => college.id === collegeId,
    );
    if (!collegeExists) {
      setCollegeId("all");
      setPage(1);
    }
  }, [collegeId, overview?.colleges]);

  const filteredDepartments = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return departments.filter((department) => {
      if (collegeId !== "all" && department.college?.id !== collegeId) {
        return false;
      }
      if (status !== "all") {
        const active = status === "active";
        if (department.is_active !== active) {
          return false;
        }
      }

      if (!term) return true;
      return [
        department.name,
        department.code,
        department.college?.name,
        department.hod_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [collegeId, debouncedSearch, departments, status]);

  const pageSize = 20;
  const pagination = useMemo(() => {
    const total = filteredDepartments.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return {
      total,
      pages,
      page: Math.min(page, pages),
      limit: pageSize,
    };
  }, [filteredDepartments.length, page]);

  const visibleDepartments = useMemo(() => {
    const start = (pagination.page - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, pagination.page]);

  useEffect(() => {
    if (page > pagination.pages) {
      setPage(pagination.pages);
    }
  }, [page, pagination.pages]);

  const handleDeleteDepartment = async () => {
    if (!token || !departmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDepartment(
        token,
        departmentToDelete.collegeId,
        departmentToDelete.id,
        true,
      );
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
      await Promise.all([
        fetchOverview(token),
        fetchDepartments(token, { page: 1, limit: 1000 }),
      ]);
      toast.success("Department deleted");
    } catch (deleteError) {
      toast.error("Delete failed", {
        description:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete department",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasHydrated || !token) {
    return (
      <ChangingLoadingState
        messages={["Preparing student department workspace..."]}
      />
    );
  }

  const isFirstLoad = loading && departments.length === 0;

  if (structureDisabled) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
        <div className="w-full min-w-0 space-y-3">
          <TenantSectionCard
            title="Departments are disabled"
            description="This university is not currently using department-level organization. Enable the department field in settings if you want to organize students below each college."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/settings?tab=profile")}
              >
                Open settings
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    collegeEnabled
                      ? "/dashboard/structure/colleges"
                      : "/dashboard/students",
                  )
                }
              >
                {collegeEnabled
                  ? "View colleges"
                  : `View ${participantLabels.plural}`}
              </Button>
            </div>
          </TenantSectionCard>
        </div>
      </div>
    );
  }

  if (!canManageDepartments) {
    return (
      <TenantAccessRestricted
        title="Department access restricted"
        subtitle="Your university role does not allow department management."
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-3">
        <TenantPageHeader
          eyebrow="University structure"
          icon={<Building2 className="h-5 w-5" />}
          title="Department operations"
          subtitle={`Track department health${collegeEnabled ? " across colleges" : ""}, review active structure, and jump directly into filtered ${participantLabels.singular.toLowerCase()} lists.`}
          actions={
            canManageDepartments ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => router.push("/dashboard/structure/colleges")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Manage colleges
              </Button>
            ) : undefined
          }
          stats={[
            {
              label: "Departments",
              value:
                overview?.totals.total_departments?.toLocaleString() || "0",
            },
            {
              label: "Active",
              value:
                overview?.totals.active_departments?.toLocaleString() || "0",
            },
            {
              label: "Inactive",
              value:
                overview?.totals.inactive_departments?.toLocaleString() || "0",
            },
            {
              label: participantLabels.plural,
              value: overview?.totals.total_students?.toLocaleString() || "0",
            },
          ]}
        />

        <TenantSectionCard
          title="Filter departments"
          description={`Search by department${collegeEnabled ? ", narrow by college," : ""} and focus on only the active structure entries you need.`}
        >
          <DepartmentFilters
            search={search}
            onSearchChange={setSearch}
            collegeId={collegeId}
            onCollegeChange={(value) => {
              setCollegeId(value);
              setPage(1);
            }}
            status={status}
            onStatusChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            colleges={(overview?.colleges || []).map((college) => ({
              id: college.id,
              name: college.name,
              code: college.code,
            }))}
          />
        </TenantSectionCard>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5 shadow-none">
            <CardContent className="flex items-start gap-2 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {isFirstLoad ? (
          <ChangingLoadingState
            messages={[
              "Loading departments...",
              "Building department mappings...",
              `Preparing ${participantLabels.singular.toLowerCase()} management view...`,
            ]}
          />
        ) : (
          <>
            {loading && departments.length > 0 && (
              <ChangingLoadingState
                messages={[
                  "Refreshing departments...",
                  "Applying active filters...",
                ]}
                className="min-h-[140px]"
              />
            )}

            <TenantSectionCard
              title="Department registry"
              description={`Compact department cards for ${participantLabels.singular.toLowerCase()} counts, ${collegeEnabled ? "college mapping, " : ""}active state, and quick drill-down actions.`}
              contentClassName="overflow-hidden px-0 pb-0"
            >
              <div className="w-full min-w-0 max-w-full overflow-hidden px-3 pb-3">
                <DepartmentTable
                  departments={visibleDepartments}
                  participantPluralLabel={participantLabels.plural}
                  canDelete={canManageDepartments}
                  onDelete={(department) => {
                    if (!department.college?.id) return;
                    setDepartmentToDelete({
                      id: department._id,
                      collegeId: department.college.id,
                      name: department.name,
                      code: department.code,
                    });
                    setDeleteDialogOpen(true);
                  }}
                  onViewStudents={(department) => {
                    if (!department.college?.id || !department._id) return;
                    router.push(
                      `/dashboard/students?college_id=${encodeURIComponent(
                        department.college.id,
                      )}&department_id=${encodeURIComponent(
                        department._id,
                      )}&ref=${encodeURIComponent(
                        "/dashboard/structure/departments",
                      )}`,
                    );
                  }}
                />
              </div>
            </TenantSectionCard>

            {pagination.pages > 1 && (
              <Card className="border shadow-none">
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
            )}
          </>
        )}
      </div>

      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => void handleDeleteDepartment()}
        departmentName={departmentToDelete?.name}
        departmentCode={departmentToDelete?.code}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense
      fallback={
        <ChangingLoadingState
          messages={[
            "Preparing department workspace...",
            "Restoring filters and structure...",
          ]}
        />
      }
    >
      <DepartmentsPageContent />
    </Suspense>
  );
}
