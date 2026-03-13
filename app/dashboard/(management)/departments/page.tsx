"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/College";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  DepartmentFilters,
  DepartmentOverviewCards,
} from "@/components/departments";
import { DepartmentTable } from "@/components/departments/department-table";
import { TablePaginationControls } from "@/components/shared/table-pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useDepartmentStore } from "@/lib/store/useDepartmentStore";

export default function DepartmentsPage() {
  const router = useRouter();
  const { token, hasHydrated, admin } = useAuthStore();
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

  const isSuperAdmin = admin?.role === "super_admin";

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
      <ChangingLoadingState messages={["Preparing department workspace..."]} />
    );
  }

  const isFirstLoad = loading && departments.length === 0;

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-2">
        <PageHeader
          title="Department Management"
          subtitle="Manage all departments across colleges"
          actions={
            isSuperAdmin ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => router.push("/dashboard/colleges")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            ) : undefined
          }
        />

        <DepartmentOverviewCards totals={overview?.totals} />

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
              "Building college mappings...",
              "Preparing management view...",
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

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <DepartmentTable
                departments={departments}
                onViewStudents={(department) =>
                  router.push(
                    `/dashboard/students?college_id=${encodeURIComponent(
                      department.college.id,
                    )}&search=${encodeURIComponent(
                      department.name,
                    )}&ref=${encodeURIComponent("/dashboard/departments")}`,
                  )
                }
              />
            </div>

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
