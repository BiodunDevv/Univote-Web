"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Plus,
  ScanFace,
  UserCog,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { CreateStudentModal } from "@/components/tenants/students/Modals";
import { ParticipantEditDialog } from "@/components/tenants/students/participant-edit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  StudentImagePreviewDialog,
  StudentsRegistryFilters,
  StudentsRegistryTable,
  StudentsRegistryPagination,
  type StudentImagePreview,
} from "@/components/tenants/students/registry";
import {
  TenantEmptyState,
  TenantPageHeader,
  TenantSectionCard,
  hasTenantPermission,
} from "@/components/tenants/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
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

const studentCoverageChartConfig = {
  total: {
    label: "Participants",
    color: "var(--chart-1)",
  },
  active: {
    label: "Active",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated, admin, membership, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const showCollegeField = isTenantParticipantFieldEnabled(tenant, "college");
  const showDepartmentField = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );
  const showLevelField = isTenantParticipantFieldEnabled(tenant, "level");
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
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const canManageStudents =
    admin?.role === "super_admin" ||
    hasTenantPermission(membership?.permissions, [
      "students.manage",
      "tenant.manage",
    ]);
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
      college_id:
        showCollegeField && selectedCollegeId !== "all"
          ? selectedCollegeId
          : undefined,
      department_id:
        showDepartmentField && selectedDepartmentId !== "all"
          ? selectedDepartmentId
          : undefined,
      level: showLevelField && level !== "all" ? level : undefined,
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
      showCollegeField,
      showDepartmentField,
      showLevelField,
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
  const editingStudent =
    students.find((student) => student._id === editingStudentId) || null;
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
    canManageStudents &&
    searchParams.get("open") === "create";
  const studentCoverage = (overview?.by_college || [])
    .slice()
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);
  const busiestDepartments = (overview?.by_department || []).slice(0, 6);
  const initialLoadingMessages = [
    `Loading ${participantLabels.singular.toLowerCase()} registry...`,
    showCollegeField || showDepartmentField
      ? "Compiling structure filters..."
      : "Compiling registry filters...",
    "Preparing access records...",
  ];
  const refetchLoadingMessages = [
    `Refreshing ${participantLabels.singular.toLowerCase()} list...`,
    "Applying filters...",
    "Syncing latest registry data...",
  ];

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
    if (!showCollegeField && selectedCollegeId !== "all") {
      setSelectedCollegeId("all");
    }
    if (!showDepartmentField && selectedDepartmentId !== "all") {
      setSelectedDepartmentId("all");
    }
    if (!showLevelField && level !== "all") {
      setLevel("all");
    }
  }, [
    level,
    selectedCollegeId,
    selectedDepartmentId,
    showCollegeField,
    showDepartmentField,
    showLevelField,
  ]);

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
    if (selectedIds.length === 0 || !canManageStudents) return;

    try {
      await bulkUpdateStudents.mutateAsync({
        studentIds: selectedIds,
        updates: { is_active: isActive },
      });
      await Promise.all([studentsQuery.refetch(), overviewQuery.refetch()]);
      setSelectedIds([]);
      toast.success(
        isActive
          ? `Selected ${participantLabels.plural.toLowerCase()} marked active`
          : `Selected ${participantLabels.plural.toLowerCase()} marked inactive`,
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
      toast.success(`${participantLabels.singular} created`, {
        description: `${response.results.created} created, ${response.results.failed} failed`,
      });
      setUploadSummary(response.results);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to create ${participantLabels.singular.toLowerCase()}`;
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
      toast.success(`${participantLabels.singular} upload completed`, {
        description: `${response.results.created} created, ${response.results.failed} failed out of ${response.results.total}`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to upload ${participantLabels.plural.toLowerCase()}`;
      setCreateStudentError(message);
      toast.error("Upload failed", { description: message });
    }
  };

  const handleMarkActive = async (studentId: string) => {
    try {
      await activateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success(`${participantLabels.singular} marked active`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to mark ${participantLabels.singular.toLowerCase()} active`;
      toast.error("Update failed", { description: message });
    }
  };

  const handleMarkInactive = async (studentId: string) => {
    try {
      await deactivateStudent.mutateAsync(studentId);
      await refreshCurrentView();
      toast.success(`${participantLabels.singular} marked inactive`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to mark ${participantLabels.singular.toLowerCase()} inactive`;
      toast.error("Update failed", { description: message });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const proceed = window.confirm(
      `Delete this ${participantLabels.singular.toLowerCase()} permanently? This will also remove their votes.`,
    );
    if (!proceed) return;

    try {
      await deleteStudent.mutateAsync({ studentId, soft: false });
      await refreshCurrentView();
      toast.success(`${participantLabels.singular} deleted`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to delete ${participantLabels.singular.toLowerCase()}`;
      toast.error("Delete failed", { description: message });
    }
  };

  if (!hasHydrated || !token) {
    return (
      <ChangingLoadingState
        messages={[
          `Preparing ${participantLabels.singular.toLowerCase()} workspace...`,
        ]}
      />
    );
  }

  const isFirstLoad = loading && students.length === 0;
  const isRefetching = studentsQuery.isFetching && students.length > 0;

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-2">
        <TenantPageHeader
          eyebrow={`Tenant ${participantLabels.plural.toLowerCase()}`}
          icon={<Users className="h-5 w-5" />}
          title={`${participantLabels.singular} Management`}
          subtitle={`Search, validate, activate, upload, and maintain every ${participantLabels.singular.toLowerCase()} record across the tenant workspace.`}
          stats={[
            {
              label: "Registry",
              value: overview?.totals.total_students?.toLocaleString() || "0",
            },
            {
              label: "Active",
              value: overview?.totals.active_students?.toLocaleString() || "0",
            },
            {
              label: "Inactive",
              value: overview?.totals.inactive_students?.toLocaleString() || "0",
            },
            {
              label: "Face ready",
              value: overview?.totals.with_facial_data?.toLocaleString() || "0",
            },
          ]}
          actions={
            canManageStudents ? (
              <Button
                size="sm"
                className="h-10"
                onClick={() => {
                  setCreateStudentError(null);
                  setCreateModalOpen(true);
                  setDismissCreateParam(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {`Add ${participantLabels.singular}`}
              </Button>
            ) : undefined
          }
        />
        {showCollegeField || showDepartmentField ? (
          <div className="gap-4">
            <TenantSectionCard
              title={`${participantLabels.singular} coverage by college`}
              description={`Monitor where the largest ${participantLabels.plural.toLowerCase()} populations sit and compare total records with active access.`}
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Top colleges
              </div>
            }
            >
            {showCollegeField && studentCoverage.length > 0 ? (
              <ChartContainer
                config={{
                  ...studentCoverageChartConfig,
                  total: {
                    ...studentCoverageChartConfig.total,
                    label: participantLabels.plural,
                  },
                }}
                className="h-[290px] w-full"
              >
                <BarChart accessibilityLayer data={studentCoverage}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="college"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => value.slice(0, 14)}
                  />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={10}
                  />
                  <Bar
                    dataKey="active"
                    fill="var(--color-active)"
                    radius={10}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                {showCollegeField
                  ? "College distribution will appear here as soon as the registry is populated."
                  : "This tenant does not use college-based participant structure."}
              </div>
            )}
          </TenantSectionCard>
{/* 
          <TenantSectionCard
            title="Most populated departments"
            description={`A quick read on the departments carrying the heaviest ${participantLabels.singular.toLowerCase()} footprint.`}
            contentClassName="space-y-3"
          >
            {showDepartmentField && busiestDepartments.length > 0 ? (
              busiestDepartments.map((item) => (
                <div
                  key={`${item.college}-${item.department}`}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.department}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.college}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                {showDepartmentField
                  ? "Department-level distribution will appear here once records are available."
                  : "This tenant does not use department-based participant structure."}
              </div>
            )}
          </TenantSectionCard> */}
          </div>
        ) : null}

        <TenantSectionCard
          title="Filter and act"
          description={
            showCollegeField || showDepartmentField || showLevelField
              ? "Refine the registry by available structure fields, status, or facial verification state. Bulk actions stay scoped to the selected rows."
              : "Refine the registry by identity search, status, or facial verification state. Bulk actions stay scoped to the selected rows."
          }
          action={
            selectedIds.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <UserCog className="h-3.5 w-3.5" />
                {selectedIds.length} selected
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <ScanFace className="h-3.5 w-3.5" />
                Registry controls
              </div>
            )
          }
          contentClassName="space-y-4"
        >
          <StudentsRegistryFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={`Search ${participantLabels.singular.toLowerCase()} name, email, or identifier`}
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
            canManageStudents={canManageStudents}
            selectedCount={selectedIds.length}
            isBulkUpdating={isBulkUpdating}
            onBulkActive={() => void handleBulkStatus(true)}
            onBulkInactive={() => void handleBulkStatus(false)}
            overview={overview}
            showCollegeFilter={showCollegeField}
            showDepartmentFilter={showDepartmentField}
            showLevelFilter={showLevelField}
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

        {uploadSummary && (
          <TenantSectionCard
            title="Latest upload summary"
            description={`Created ${uploadSummary.created} of ${uploadSummary.total} submitted rows${[
              uploadSummary.target.college,
              uploadSummary.target.department,
              uploadSummary.target.level,
            ]
              .filter(Boolean)
              .length > 0
              ? ` for ${[
                  uploadSummary.target.college,
                  uploadSummary.target.department,
                  uploadSummary.target.level,
                ]
                  .filter(Boolean)
                  .join(" / ")}`
              : ""}.`}
            action={
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setUploadSummary(null)}
              >
                Dismiss
              </Button>
            }
            contentClassName="space-y-4"
          >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Upload feedback
                </div>
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
          </TenantSectionCard>
        )}

        {isFirstLoad ? (
          <ChangingLoadingState messages={initialLoadingMessages} />
        ) : (
          <>
            {isRefetching && (
              <ChangingLoadingState
                messages={refetchLoadingMessages}
                className="min-h-[140px]"
              />
            )}

            <TenantSectionCard
              title={`${participantLabels.singular} registry`}
              description={`Compact ${participantLabels.singular.toLowerCase()} cards for search, review, image preview, activation changes, and direct record actions.`}
              contentClassName="space-y-4"
            >
              <div className="w-full min-w-0 max-w-full overflow-hidden">
                <StudentsRegistryTable
                  students={students}
                  selectedIds={selectedIds}
                  canManageStudents={canManageStudents}
                  participantSingularLabel={participantLabels.singular}
                  showCollegeField={showCollegeField}
                  showDepartmentField={showDepartmentField}
                  showLevelField={showLevelField}
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
                  router.push(`/dashboard/participants/${studentId}`)
                }
                onEdit={(studentId: string) => setEditingStudentId(studentId)}
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
            </TenantSectionCard>

            {!loading && students.length === 0 && (
              <TenantEmptyState
                icon={Users}
                title={`No ${participantLabels.plural.toLowerCase()} found`}
                description={`Adjust your current filters, or add new ${participantLabels.plural.toLowerCase()} to populate the registry.`}
              />
            )}

            <StudentImagePreviewDialog
              previewImage={previewImage}
              onClose={() => setPreviewImage(null)}
            />

            <ParticipantEditDialog
              open={Boolean(editingStudent)}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingStudentId(null);
                }
              }}
              student={editingStudent}
              overview={overview}
              onUpdated={refreshCurrentView}
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
