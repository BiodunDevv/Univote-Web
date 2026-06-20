"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Plus,
  Search,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { ParticipantEditDialog } from "@/components/tenants/students/participant-edit-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StudentImagePreviewDialog,
  StudentsRegistryTable,
  StudentsRegistryPagination,
  type StudentImagePreview,
} from "@/components/tenants/students/registry";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantPageHeader,
} from "@/components/tenants/shared";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import { getTenantParticipantLabels, isTenantParticipantFieldEnabled } from "@/lib/tenant-config";
import {
  useActivateStudentMutation,
  useAdminStudentsOverviewQuery,
  useAdminStudentsQuery,
  useBulkUpdateStudentsMutation,
  useDeactivateStudentMutation,
  useDeleteStudentMutation,
} from "@/lib/queries/admin";
export function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const showCollegeField = isTenantParticipantFieldEnabled(tenant, "college");
  const showDepartmentField = isTenantParticipantFieldEnabled(tenant, "department");
  const showLevelField = isTenantParticipantFieldEnabled(tenant, "level");
  const showPhotoField = isTenantParticipantFieldEnabled(tenant, "photo_url");
  const showFaceField =
    showPhotoField && isTenantParticipantFieldEnabled(tenant, "face_verification");
  const isAuthorized = hasHydrated && Boolean(token);
  const initialSearch = searchParams.get("search") || "";
  const initialCollegeId = searchParams.get("college_id") || "all";
  const initialDepartmentId = searchParams.get("department_id") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialFacial = searchParams.get("facial") || "all";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(initialCollegeId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(initialDepartmentId);
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<string>(initialStatus);
  const [facial, setFacial] = useState<string>(initialFacial);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<StudentImagePreview | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentMode, setEditingStudentMode] = useState<"view" | "edit">("view");
  const [statusActionStudentId, setStatusActionStudentId] = useState<string | null>(null);
  const [statusActionType, setStatusActionType] = useState<"activate" | "deactivate" | null>(null);

  const canManageStudents =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["students.manage", "tenant.manage"]);
  const canViewStudents =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, [
      "participants.view",
      "participants.manage",
      "students.manage",
      "tenant.manage",
    ]);

  const studentsQuery = useAdminStudentsQuery({ page: 1, limit: 1000 }, { enabled: isAuthorized });
  const overviewQuery = useAdminStudentsOverviewQuery({ enabled: isAuthorized });
  const activateStudent = useActivateStudentMutation();
  const deactivateStudent = useDeactivateStudentMutation();
  const deleteStudent = useDeleteStudentMutation();
  const bulkUpdateStudents = useBulkUpdateStudentsMutation();
  const isBulkUpdating = bulkUpdateStudents.isPending;
  const allStudents = useMemo(
    () => studentsQuery.data?.students ?? [],
    [studentsQuery.data?.students],
  );
  const overview = overviewQuery.data ?? null;

  const collegeOptions = useMemo(() => overview?.colleges || [], [overview?.colleges]);
  const departmentOptions = useMemo(
    () =>
      selectedCollegeId !== "all"
        ? collegeOptions.find((c) => c.id === selectedCollegeId)?.departments || []
        : collegeOptions.flatMap((c) => c.departments),
    [collegeOptions, selectedCollegeId],
  );
  const levelOptions = overview?.levels || [];

  const filteredStudents = useMemo(() => {
    const normalizedSearch = debouncedSearch.toLowerCase();
    return allStudents.filter((student) => {
      if (showCollegeField && selectedCollegeId !== "all") {
        const selectedCollege = overview?.colleges.find((c) => c.id === selectedCollegeId);
        if (!selectedCollege || student.college !== selectedCollege.name) return false;
      }
      if (showDepartmentField && selectedDepartmentId !== "all") {
        const selectedDepartment = overview?.colleges
          .flatMap((c) => c.departments)
          .find((d) => d.id === selectedDepartmentId);
        if (!selectedDepartment || student.department !== selectedDepartment.name) return false;
      }
      if (showLevelField && level !== "all" && (student.level || "") !== level) return false;
      if (status !== "all" && Boolean(student.is_active) !== (status === "active")) return false;
      if (showFaceField && facial !== "all") {
        if (Boolean(student.has_facial_data) !== (facial === "registered")) return false;
      }
      if (!normalizedSearch) return true;
      return [student.full_name, student.email, student.display_identifier, student.matric_no]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [allStudents, debouncedSearch, facial, level, overview?.colleges, selectedCollegeId, selectedDepartmentId, showCollegeField, showDepartmentField, showFaceField, showLevelField, status]);

  const pageSize = 20;
  const pagination = useMemo(() => {
    const total = filteredStudents.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pages);
    return { total, page: safePage, pages, limit: pageSize };
  }, [filteredStudents.length, page]);

  const students = useMemo(() => {
    const start = (pagination.page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, pagination.page]);

  const editingStudent = allStudents.find((s) => s._id === editingStudentId) || null;
  const error =
    (studentsQuery.error instanceof Error ? studentsQuery.error.message : undefined) ||
    (overviewQuery.error instanceof Error ? overviewQuery.error.message : undefined) ||
    null;
  const loading = studentsQuery.isLoading || overviewQuery.isLoading;
  const collegeCodeMap = useMemo(
    () => Object.fromEntries((overview?.colleges || []).map((c) => [c.name, c.code])),
    [overview?.colleges],
  );
  const selectedCollegeCode =
    selectedCollegeId !== "all"
      ? collegeOptions.find((item) => item.id === selectedCollegeId)?.code
      : undefined;
  const selectedDepartmentCode =
    selectedDepartmentId !== "all"
      ? departmentOptions.find((item) => item.id === selectedDepartmentId)?.code
      : undefined;

  const activeFilterCount = [
    selectedCollegeId !== "all",
    selectedDepartmentId !== "all",
    level !== "all",
    status !== "all",
    facial !== "all",
    debouncedSearch.length > 0,
  ].filter(Boolean).length;

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

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setDebouncedSearch(searchParams.get("search") || "");
    setSelectedCollegeId(searchParams.get("college_id") || "all");
    setSelectedDepartmentId(searchParams.get("department_id") || "all");
    setStatus(searchParams.get("status") || "all");
    setFacial(searchParams.get("facial") || "all");
    setPage(1);
    setSelectedIds([]);
  }, [searchParams]);

  useEffect(() => {
    if (!overview?.colleges?.length) return;

    if (
      selectedCollegeId !== "all" &&
      !overview.colleges.some((college) => college.id === selectedCollegeId)
    ) {
      setSelectedCollegeId("all");
      setSelectedDepartmentId("all");
      setPage(1);
      return;
    }

    if (selectedDepartmentId === "all") return;

    const departmentBelongsToSelection =
      selectedCollegeId !== "all"
        ? departmentOptions.some(
            (department) => department.id === selectedDepartmentId,
          )
        : overview.colleges
            .flatMap((college) => college.departments)
            .some((department) => department.id === selectedDepartmentId);

    if (!departmentBelongsToSelection) {
      setSelectedDepartmentId("all");
      setPage(1);
    }
  }, [
    departmentOptions,
    overview?.colleges,
    selectedCollegeId,
    selectedDepartmentId,
  ]);

  useEffect(() => {
    if (page > pagination.pages) setPage(pagination.pages);
  }, [page, pagination.pages]);

  useEffect(() => {
    if (!showCollegeField && selectedCollegeId !== "all") setSelectedCollegeId("all");
    if (!showDepartmentField && selectedDepartmentId !== "all") setSelectedDepartmentId("all");
    if (!showLevelField && level !== "all") setLevel("all");
  }, [level, selectedCollegeId, selectedDepartmentId, showCollegeField, showDepartmentField, showLevelField]);

  const allVisibleSelected =
    students.length > 0 && students.every((s) => selectedIds.includes(s._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !students.some((s) => s._id === id)));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      students.forEach((s) => merged.add(s._id));
      return Array.from(merged);
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0 || !canManageStudents) return;
    try {
      await bulkUpdateStudents.mutateAsync({ studentIds: selectedIds, updates: { is_active: isActive } });
      await Promise.all([studentsQuery.refetch(), overviewQuery.refetch()]);
      setSelectedIds([]);
      toast.success(isActive ? "Selected students marked active" : "Selected students marked inactive");
    } catch {
      return;
    }
  };

  const refreshCurrentView = async () => {
    await Promise.all([studentsQuery.refetch(), overviewQuery.refetch()]);
  };

  const handleMarkActive = async (studentId: string) => {
    try {
      setStatusActionStudentId(studentId);
      setStatusActionType("activate");
      await activateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success("Student marked active");
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Failed to activate student",
      });
    } finally {
      setStatusActionStudentId(null);
      setStatusActionType(null);
    }
  };

  const handleMarkInactive = async (studentId: string) => {
    try {
      setStatusActionStudentId(studentId);
      setStatusActionType("deactivate");
      await deactivateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success("Student marked inactive");
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Failed to deactivate student",
      });
    } finally {
      setStatusActionStudentId(null);
      setStatusActionType(null);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const proceed = window.confirm("Delete this student permanently? This will also remove their votes.");
    if (!proceed) return;
    try {
      await deleteStudent.mutateAsync({ studentId, soft: false });
      await refreshCurrentView();
      toast.success("Student deleted");
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Failed to delete student",
      });
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCollegeId("all");
    setSelectedDepartmentId("all");
    setLevel("all");
    setStatus("all");
    setFacial("all");
    setPage(1);
    setSelectedIds([]);
  };

  if (!hasHydrated || !token) {
    return <ChangingLoadingState messages={["Preparing student workspace..."]} />;
  }

  if (!canViewStudents) {
    return (
      <TenantAccessRestricted
        title="Student registry access is restricted"
        description="Your current role cannot access the student registry. Ask your workspace owner for participant access."
      />
    );
  }

  const isFirstLoad = loading && students.length === 0;
  const isRefetching = studentsQuery.isFetching && students.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        icon={<Users className="h-5 w-5" />}
        title="Student Registry"
        subtitle="Search, review, activate, and manage every student record across this workspace."
        stats={[
          { label: "Total", value: overview?.totals.total_students?.toLocaleString() || "0" },
          { label: "Active", value: overview?.totals.active_students?.toLocaleString() || "0" },
          { label: "Inactive", value: overview?.totals.inactive_students?.toLocaleString() || "0" },
          ...(showFaceField
            ? [{ label: "Face enrolled", value: overview?.totals.with_facial_data?.toLocaleString() || "0" }]
            : []),
        ]}
        actions={
          canManageStudents ? (
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/students/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add student
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-start gap-2 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
              <div className="relative min-w-[180px] xl:flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, or ID…"
                  className="h-9 pl-8 text-sm"
                />
              </div>

              {showCollegeField ? (
                <Select value={selectedCollegeId} onValueChange={(v) => { setSelectedCollegeId(v); setSelectedDepartmentId("all"); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="h-9 text-sm [&>span]:truncate">
                    <SelectValue placeholder="College">
                      {selectedCollegeCode || "College"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All colleges</SelectItem>
                    {collegeOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {showDepartmentField ? (
                <Select value={selectedDepartmentId} onValueChange={(v) => { setSelectedDepartmentId(v); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="h-9 text-sm [&>span]:truncate">
                    <SelectValue placeholder="Department">
                      {selectedDepartmentCode || "Department"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departmentOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {showLevelField ? (
                <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {levelOptions.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : null}

              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); setSelectedIds([]); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {showFaceField ? (
                <Select value={facial} onValueChange={(v) => { setFacial(v); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Face data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All face status</SelectItem>
                    <SelectItem value="registered">Enrolled</SelectItem>
                    <SelectItem value="not-registered">Not enrolled</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}

              {activeFilterCount > 0 ? (
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={clearAllFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                  <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px]">{activeFilterCount}</Badge>
                </Button>
              ) : null}
            </div>

            {canManageStudents && selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <div className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-3 py-1 text-xs">
                  <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{selectedIds.length}</span>
                  <span className="text-muted-foreground">selected</span>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isBulkUpdating} onClick={() => void handleBulkStatus(true)}>
                  Mark active
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isBulkUpdating} onClick={() => void handleBulkStatus(false)}>
                  Mark inactive
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => setSelectedIds([])}>
                  Clear selection
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {isFirstLoad ? (
        <ChangingLoadingState
          messages={[
            "Loading student registry…",
            "Compiling filters…",
            "Preparing access records…",
          ]}
        />
      ) : (
        <>
          {isRefetching ? (
            <ChangingLoadingState
              messages={["Refreshing student list…", "Applying filters…"]}
              className="min-h-[80px]"
            />
          ) : null}

          <Card className="border shadow-none">
            <CardContent className="p-4">
              <StudentsRegistryTable
                students={students}
                collegeCodeMap={collegeCodeMap}
                rowStartIndex={(pagination.page - 1) * pagination.limit}
                selectedIds={selectedIds}
                canManageStudents={canManageStudents}
                participantSingularLabel={participantLabels.singular}
                participantPluralLabel={participantLabels.plural}
                showCollegeField={showCollegeField}
                showDepartmentField={showDepartmentField}
                showLevelField={showLevelField}
                showFaceField={showFaceField}
                showPhotoField={showPhotoField}
                onToggleAll={toggleSelectAll}
                allVisibleSelected={allVisibleSelected}
                onToggleOne={(studentId, checked) => {
                  setSelectedIds((prev) => {
                    if (checked) return Array.from(new Set([...prev, studentId]));
                    return prev.filter((id) => id !== studentId);
                  });
                }}
                onView={(studentId) => { setEditingStudentId(studentId); setEditingStudentMode("view"); }}
                onEdit={(studentId) => router.push(`/dashboard/students/${studentId}/edit`)}
                onMarkActive={(studentId) => void handleMarkActive(studentId)}
                onMarkInactive={(studentId) => void handleMarkInactive(studentId)}
                onDelete={(studentId) => void handleDeleteStudent(studentId)}
                onPreviewImage={setPreviewImage}
                statusActionStudentId={statusActionStudentId}
                statusActionType={statusActionType}
              />
            </CardContent>
          </Card>

          {students.length > 0 ? (
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
          ) : null}

          {!loading && students.length === 0 ? (
            <TenantEmptyState
              icon={Users}
              title="No students found"
              description="Adjust your filters or add new students to populate the registry."
            />
          ) : null}

          <StudentImagePreviewDialog previewImage={previewImage} onClose={() => setPreviewImage(null)} />

          <ParticipantEditDialog
            open={Boolean(editingStudent)}
            onOpenChange={(open) => { if (!open) setEditingStudentId(null); }}
            student={editingStudent}
            overview={overview}
            onUpdated={refreshCurrentView}
            initialMode={editingStudentMode}
          />
        </>
      )}
    </div>
  );
}

export default function StudentsPageRoute() {
  return (
    <Suspense fallback={null}>
      <StudentsPage />
    </Suspense>
  );
}
