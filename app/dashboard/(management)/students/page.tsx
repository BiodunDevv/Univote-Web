"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/College";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { CreateStudentModal } from "@/components/students/Modals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  StudentImagePreviewDialog,
  StudentsOverviewCards,
  StudentsRegistryFilters,
  StudentsRegistryTable,
  StudentsRegistryPagination,
  type StudentImagePreview,
} from "@/components/students/registry";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useActivateStudentMutation,
  useAdminStudentsOverviewQuery,
  useAdminStudentsQuery,
  useBulkUpdateStudentsMutation,
  useDeactivateStudentMutation,
  useDeleteStudentMutation,
  useUploadStudentsMutation,
} from "@/lib/queries/admin";
import type { StudentCSVData, UploadStudentsResponse } from "@/types/student";

const INITIAL_LOADING_MESSAGES = [
  "Loading student registry...",
  "Compiling college and department filters...",
  "Preparing voter records...",
];

const REFETCH_LOADING_MESSAGES = [
  "Refreshing student list...",
  "Applying filters...",
  "Syncing latest registry data...",
];

export function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated, admin } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const initialSearch = searchParams.get("search") || "";
  const initialCollegeId = searchParams.get("college_id") || "all";
  const initialDepartmentId = searchParams.get("department_id") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialFacial = searchParams.get("facial") || "all";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCollegeId, setSelectedCollegeId] =
    useState<string>(initialCollegeId);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<string>(initialDepartmentId);
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<string>(initialStatus);
  const [facial, setFacial] = useState<string>(initialFacial);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<StudentImagePreview | null>(
    null,
  );

  const isSuperAdmin = admin?.role === "super_admin";
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dismissCreateParam, setDismissCreateParam] = useState(false);
  const [createStudentError, setCreateStudentError] = useState<string | null>(
    null,
  );
  const [uploadSummary, setUploadSummary] = useState<
    UploadStudentsResponse["results"] | null
  >(null);
  const createMode = searchParams.get("mode") === "bulk" ? "bulk" : "manual";

  const studentFilters = useCallback(
    () => ({
      page,
      limit: 10,
      college_id: selectedCollegeId !== "all" ? selectedCollegeId : undefined,
      department_id:
        selectedDepartmentId !== "all" ? selectedDepartmentId : undefined,
      level: level !== "all" ? level : undefined,
      is_active:
        status === "all" ? undefined : status === "active" ? true : false,
      has_facial_data:
        facial === "all" ? undefined : facial === "registered" ? true : false,
      search: debouncedSearch || undefined,
    }),
    [
      page,
      selectedCollegeId,
      selectedDepartmentId,
      level,
      status,
      facial,
      debouncedSearch,
    ],
  );
  const studentsQuery = useAdminStudentsQuery(studentFilters(), {
    enabled: isAuthorized,
  });
  const overviewQuery = useAdminStudentsOverviewQuery({
    enabled: isAuthorized,
  });
  const uploadStudents = useUploadStudentsMutation();
  const activateStudent = useActivateStudentMutation();
  const deactivateStudent = useDeactivateStudentMutation();
  const deleteStudent = useDeleteStudentMutation();
  const bulkUpdateStudents = useBulkUpdateStudentsMutation();
  const isBulkUpdating = bulkUpdateStudents.isPending;
  const isCreatingStudent = uploadStudents.isPending;
  const students = studentsQuery.data?.students ?? [];
  const overview = overviewQuery.data ?? null;
  const pagination = {
    total: studentsQuery.data?.total ?? 0,
    page: studentsQuery.data?.page ?? page,
    pages: studentsQuery.data?.pages ?? 1,
    limit: 10,
  };
  const error =
    (studentsQuery.error instanceof Error
      ? studentsQuery.error.message
      : undefined) ||
    (overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : undefined) ||
    null;
  const loading = studentsQuery.isLoading || overviewQuery.isLoading;
  const shouldOpenCreateFromQuery =
    !dismissCreateParam &&
    hasHydrated &&
    isSuperAdmin &&
    searchParams.get("open") === "create";

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      const currentRef = `${window.location.pathname}${window.location.search}`;
      router.replace(`/auth/signin?ref=${encodeURIComponent(currentRef)}`);
    }
  }, [hasHydrated, router, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
      setSelectedIds([]);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const allVisibleSelected =
    students.length > 0 &&
    students.every((student) => selectedIds.includes(student._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !students.some((s) => s._id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const merged = new Set(prev);
      students.forEach((student) => merged.add(student._id));
      return Array.from(merged);
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0 || !isSuperAdmin) return;

    try {
      await bulkUpdateStudents.mutateAsync({
        studentIds: selectedIds,
        updates: { is_active: isActive },
      });
      await Promise.all([studentsQuery.refetch(), overviewQuery.refetch()]);
      setSelectedIds([]);
      toast.success(
        isActive ? "Selected students marked active" : "Selected students marked inactive",
      );
    } catch {
      return;
    }
  };

  const refreshCurrentView = async () => {
    await Promise.all([studentsQuery.refetch(), overviewQuery.refetch()]);
  };

  const handleCreateManual = async (payload: StudentCSVData) => {
    setCreateStudentError(null);
    try {
      const response = await uploadStudents.mutateAsync({
        csvData: [payload],
        target: {
          college: payload.college,
          department: payload.department,
          level: payload.level,
        },
      });
      setCreateModalOpen(false);
      await refreshCurrentView();
      toast.success("Student created", {
        description: `${response.results.created} created, ${response.results.failed} failed`,
      });
      setUploadSummary(response.results);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create student";
      setCreateStudentError(message);
      toast.error("Create failed", { description: message });
    }
  };

  const handleCreateBulk = async (
    csvData: StudentCSVData[],
    target?: { college?: string; department?: string; level?: string },
  ) => {
    setCreateStudentError(null);
    try {
      const response = await uploadStudents.mutateAsync({ csvData, target });
      setCreateModalOpen(false);
      await refreshCurrentView();
      setUploadSummary(response.results);
      toast.success("Bulk upload completed", {
        description: `${response.results.created} created, ${response.results.failed} failed out of ${response.results.total}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload students";
      setCreateStudentError(message);
      toast.error("Upload failed", { description: message });
    }
  };

  const handleMarkActive = async (studentId: string) => {
    try {
      await activateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success("Student marked active");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark student active";
      toast.error("Update failed", { description: message });
    }
  };

  const handleMarkInactive = async (studentId: string) => {
    try {
      await deactivateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success("Student marked inactive");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark student inactive";
      toast.error("Update failed", { description: message });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const proceed = window.confirm(
      "Delete this student permanently? This will also remove their votes.",
    );
    if (!proceed) return;

    try {
      await deleteStudent.mutateAsync({ studentId, soft: false });
      await refreshCurrentView();
      toast.success("Student deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete student";
      toast.error("Delete failed", { description: message });
    }
  };

  if (!hasHydrated || !token) {
    return (
      <ChangingLoadingState messages={["Preparing student workspace..."]} />
    );
  }

  const isFirstLoad = loading && students.length === 0;
  const isRefetching = studentsQuery.isFetching && students.length > 0;

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-2">
        <PageHeader
          title="Student Management"
          subtitle="Manage all students across colleges and departments"
          actions={
            isSuperAdmin ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setCreateStudentError(null);
                  setCreateModalOpen(true);
                  setDismissCreateParam(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />

        <StudentsOverviewCards overview={overview} />

        <StudentsRegistryFilters
          search={search}
          onSearchChange={setSearch}
          selectedCollegeId={selectedCollegeId}
          onCollegeChange={(value) => {
            setSelectedCollegeId(value);
            setSelectedDepartmentId("all");
            setPage(1);
            setSelectedIds([]);
          }}
          selectedDepartmentId={selectedDepartmentId}
          onDepartmentChange={(value) => {
            setSelectedDepartmentId(value);
            setPage(1);
            setSelectedIds([]);
          }}
          level={level}
          onLevelChange={(value) => {
            setLevel(value);
            setPage(1);
            setSelectedIds([]);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
            setSelectedIds([]);
          }}
          facial={facial}
          onFacialChange={(value) => {
            setFacial(value);
            setPage(1);
            setSelectedIds([]);
          }}
          isSuperAdmin={isSuperAdmin}
          selectedCount={selectedIds.length}
          isBulkUpdating={isBulkUpdating}
          onBulkActive={() => void handleBulkStatus(true)}
          onBulkInactive={() => void handleBulkStatus(false)}
          overview={overview}
        />

        {error && (
          <Card className="border-destructive/30 bg-destructive/5 shadow-none">
            <CardContent className="flex items-start gap-2 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {uploadSummary && (
          <Card className="border shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Latest upload summary
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {uploadSummary.created} of {uploadSummary.total} submitted rows for {uploadSummary.target.college}/{uploadSummary.target.department}/{uploadSummary.target.level}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setUploadSummary(null)}
                >
                  Dismiss
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-lg font-semibold text-foreground">
                    {uploadSummary.created}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-lg font-semibold text-foreground">
                    {uploadSummary.failed}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-lg font-semibold text-foreground">
                    {uploadSummary.total}
                  </p>
                </div>
              </div>

              {uploadSummary.errors.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Row feedback
                  </p>
                  <div className="space-y-2">
                    {uploadSummary.errors.slice(0, 8).map((item, index) => (
                      <div
                        key={`${item.matric_no}-${index}`}
                        className="rounded-lg border bg-muted/20 p-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {item.full_name} ({item.matric_no})
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.error || item.warning}
                        </p>
                      </div>
                    ))}
                    {uploadSummary.errors.length > 8 ? (
                      <p className="text-xs text-muted-foreground">
                        ...and {uploadSummary.errors.length - 8} more row messages.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {isFirstLoad ? (
          <ChangingLoadingState messages={INITIAL_LOADING_MESSAGES} />
        ) : (
          <>
            {isRefetching && (
              <ChangingLoadingState
                messages={REFETCH_LOADING_MESSAGES}
                className="min-h-[140px]"
              />
            )}

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <StudentsRegistryTable
                students={students}
                selectedIds={selectedIds}
                isSuperAdmin={isSuperAdmin}
                onToggleAll={toggleSelectAll}
                allVisibleSelected={allVisibleSelected}
                onToggleOne={(studentId: string, checked: boolean) => {
                  setSelectedIds((prev) => {
                    if (checked) {
                      return Array.from(new Set([...prev, studentId]));
                    }
                    return prev.filter((id) => id !== studentId);
                  });
                }}
                onView={(studentId: string) =>
                  router.push(`/dashboard/students/${studentId}`)
                }
                onEdit={(studentId: string) =>
                  router.push(`/dashboard/students/${studentId}/edit`)
                }
                onMarkActive={(studentId: string) =>
                  void handleMarkActive(studentId)
                }
                onMarkInactive={(studentId: string) =>
                  void handleMarkInactive(studentId)
                }
                onDelete={(studentId: string) =>
                  void handleDeleteStudent(studentId)
                }
                onPreviewImage={setPreviewImage}
              />
            </div>

            <Card className="border shadow-none">
              <StudentsRegistryPagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(nextPage) =>
                  setPage(Math.max(1, Math.min(pagination.pages, nextPage)))
                }
              />
            </Card>

            {!loading && students.length === 0 && (
              <Card className="border shadow-none">
                <CardContent className="p-8 text-center">
                  <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">No students found</p>
                  <p className="text-xs text-muted-foreground">
                    Adjust filters or upload student records.
                  </p>
                </CardContent>
              </Card>
            )}

            <StudentImagePreviewDialog
              previewImage={previewImage}
              onClose={() => setPreviewImage(null)}
            />

            <CreateStudentModal
              key={createMode}
              open={createModalOpen || shouldOpenCreateFromQuery}
              onOpenChange={(open) => {
                if (!open) {
                  setDismissCreateParam(true);
                }
                setCreateModalOpen(open);
              }}
              overview={overview}
              initialMode={createMode}
              isSubmitting={isCreatingStudent}
              submitError={createStudentError}
              onCreateManual={handleCreateManual}
              onCreateBulk={handleCreateBulk}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default StudentsPage;
