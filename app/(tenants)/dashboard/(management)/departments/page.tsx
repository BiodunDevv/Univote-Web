"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Plus } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { DepartmentFilters } from "@/components/tenants/departments";
import { DepartmentTable } from "@/components/tenants/departments/department-table";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useDepartmentStore } from "@/lib/store/useDepartmentStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";
import {
  TenantPageHeader,
  TenantSectionCard,
  hasTenantPermission,
} from "@/components/tenants/shared";

function DepartmentsPageContent() {
  const router = useRouter();
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const departmentEnabled = isTenantParticipantFieldEnabled(tenant, "department");
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const {
    departments,
    overview,
    pagination,
    loading,
    error,
    fetchDepartments,
    fetchOverview,
  } = useDepartmentStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collegeId, setCollegeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const canManageDepartments =
    admin?.role === "super_admin" ||
    hasTenantPermission(membership?.permissions, [
      "tenant.manage",
      "students.manage",
    ]);

  const structureDisabled = !departmentEnabled;

  useEffect(() => {
    if (!hasHydrated || !token) return;
    void fetchOverview(token);
  }, [hasHydrated, token, fetchOverview]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!hasHydrated || !token) return;

    void fetchDepartments(token, {
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      college_id: collegeId !== "all" ? collegeId : undefined,
      is_active:
        status === "all" ? undefined : status === "active" ? true : false,
    });
  }, [
    hasHydrated,
    token,
    page,
    debouncedSearch,
    collegeId,
    status,
    fetchDepartments,
  ]);

  if (!hasHydrated || !token) {
    return (
      <ChangingLoadingState
        messages={[
          `Preparing ${participantLabels.singular.toLowerCase()} structure workspace...`,
        ]}
      />
    );
  }

  const isFirstLoad = loading && departments.length === 0;

  if (structureDisabled) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
        <div className="w-full min-w-0 space-y-3">
          <TenantSectionCard
            title="Sub-groups are disabled"
            description={`This tenant is not currently using sub-group structure. Enable the department field in settings if you want to organize ${participantLabels.plural.toLowerCase()} below the main group level.`}
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
                      : "/dashboard/participants",
                  )
                }
              >
                {collegeEnabled ? "View groups" : `View ${participantLabels.plural}`}
              </Button>
            </div>
          </TenantSectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-3">
        <TenantPageHeader
          eyebrow="Tenant structure"
          icon={<Building2 className="h-5 w-5" />}
          title="Sub-group operations"
          subtitle={`Track sub-group health${collegeEnabled ? " across groups" : ""}, review active structure, and jump directly into filtered ${participantLabels.singular.toLowerCase()} lists.`}
          actions={
            canManageDepartments ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => router.push("/dashboard/structure/colleges")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Manage structure
              </Button>
            ) : undefined
          }
          stats={[
            {
              label: "Sub-groups",
              value: overview?.totals.total_departments?.toLocaleString() || "0",
            },
            {
              label: "Active",
              value: overview?.totals.active_departments?.toLocaleString() || "0",
            },
            {
              label: "Inactive",
              value: overview?.totals.inactive_departments?.toLocaleString() || "0",
            },
            {
              label: participantLabels.plural,
              value: overview?.totals.total_students?.toLocaleString() || "0",
            },
          ]}
        />


        <TenantSectionCard
          title="Filter sub-groups"
          description={`Search by sub-group${collegeEnabled ? ", narrow by group," : ""} and focus on only the active structure entries you need.`}
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
              "Loading sub-groups...",
              "Building structure mappings...",
              `Preparing ${participantLabels.singular.toLowerCase()} management view...`,
            ]}
          />
        ) : (
          <>
            {loading && departments.length > 0 && (
              <ChangingLoadingState
                messages={[
                  "Refreshing sub-groups...",
                  "Applying active filters...",
                ]}
                className="min-h-[140px]"
              />
            )}

            <TenantSectionCard
              title="Sub-group registry"
              description={`Compact sub-group cards for ${participantLabels.singular.toLowerCase()} counts, ${collegeEnabled ? "group mapping, " : ""}active state, and quick drill-down actions.`}
              contentClassName="px-0 pb-0"
            >
              <div className="w-full min-w-0 px-3 pb-3">
                <DepartmentTable
                  departments={departments}
                  participantPluralLabel={participantLabels.plural}
                  onViewStudents={(department) =>
                    router.push(
                      `/dashboard/participants?college_id=${encodeURIComponent(
                        department.college.id,
                      )}&search=${encodeURIComponent(
                        department.name,
                      )}&ref=${encodeURIComponent("/dashboard/structure/departments")}`,
                    )
                  }
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
