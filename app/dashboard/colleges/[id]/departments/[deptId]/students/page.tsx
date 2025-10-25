"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Upload,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  GraduationCap,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useStudentStore } from "@/lib/store/useStudentStore";

export default function DepartmentStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const departmentId = params.deptId as string;

  const { token, admin } = useAuthStore();
  const { currentCollege, fetchCollegeById } = useCollegeStore();
  const {
    students,
    loading,
    error,
    pagination,
    fetchStudentsByDepartment,
    deleteStudent,
  } = useStudentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
    matric: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const isSuperAdmin = admin?.role === "super_admin";

  // Get current department
  const currentDepartment = currentCollege?.departments.find(
    (d) => d._id === departmentId
  );

  // Load college and students
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCollegeById(token || undefined, collegeId),
        fetchStudentsByDepartment(token || undefined, collegeId, departmentId, {
          page: 1,
          limit: 50,
        }),
      ]);
      setInitialLoad(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, departmentId]);

  // Handle filter changes
  const handleFilterChange = async () => {
    setIsRefreshing(true);
    await fetchStudentsByDepartment(
      token || undefined,
      collegeId,
      departmentId,
      {
        level: levelFilter !== "all" ? levelFilter : undefined,
        search: searchQuery || undefined,
        page: 1,
        limit: 50,
      }
    );
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    if (!initialLoad) {
      handleFilterChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, levelFilter]);

  const handleDeleteClick = (
    studentId: string,
    studentName: string,
    matricNo: string
  ) => {
    setStudentToDelete({ id: studentId, name: studentName, matric: matricNo });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete || !token) return;

    setIsDeleting(true);
    try {
      await deleteStudent(token, studentToDelete.id, false);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      await fetchStudentsByDepartment(token, collegeId, departmentId, {
        level: levelFilter !== "all" ? levelFilter : undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: 50,
      });
    } catch {
      // Error handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchStudentsByDepartment(token || undefined, collegeId, departmentId, {
      level: levelFilter !== "all" ? levelFilter : undefined,
      search: searchQuery || undefined,
      page: newPage,
      limit: 50,
    });
  };

  if (!currentCollege && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            College not found
          </h3>
          <Button onClick={() => router.push("/dashboard/colleges")}>
            Back to Colleges
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentDepartment && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Department not found
          </h3>
          <Button
            onClick={() => router.push(`/dashboard/colleges/${collegeId}`)}
          >
            Back to College
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/colleges/${collegeId}`)}
                className="h-8 w-8 rounded-full hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground">
                    {currentDepartment?.name}
                  </h1>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-mono font-semibold">
                    {currentDepartment?.code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3 inline mr-1" />
                  {currentCollege?.name} · {pagination.total} students
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/dashboard/colleges/${collegeId}/students/upload`
                  )
                }
                className="h-9 text-sm"
              >
                <Upload className="w-3.5 h-3.5 mr-2" />
                Upload Students
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Department Info Card */}
        {currentDepartment && (
          <Card className="p-3 border shadow-none bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">HOD</p>
                    <p className="text-sm font-medium text-foreground">
                      {currentDepartment.hod_name || "Not assigned"}
                    </p>
                  </div>
                  {currentDepartment.hod_email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs text-foreground">
                        {currentDepartment.hod_email}
                      </p>
                    </div>
                  )}
                </div>
                {currentDepartment.description && (
                  <p className="text-xs text-muted-foreground">
                    {currentDepartment.description}
                  </p>
                )}
              </div>
              <div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentDepartment.is_active
                      ? "bg-green-500/10 text-green-600"
                      : "bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {currentDepartment.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-3 border shadow-none">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or matric number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background text-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 h-9 border rounded-md bg-background text-xs"
              >
                <option value="all">All Levels</option>
                {currentDepartment?.available_levels.map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleFilterChange()}
                className="h-9 w-9"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 transition-transform duration-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive">Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Refreshing/Deleting Loading State */}
        {(isRefreshing || isDeleting) && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isDeleting ? "Deleting student..." : "Refreshing..."}
              </p>
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {((loading && !isRefreshing && !isDeleting) || initialLoad) &&
          students.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

        {/* Students Table */}
        {!loading &&
          !initialLoad &&
          !isRefreshing &&
          !isDeleting &&
          students.length > 0 && (
            <Card className="border shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Matric No
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Full Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Level
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      {isSuperAdmin && (
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-primary">
                          {student.matric_no}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {student.full_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {student.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.is_active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-gray-500/10 text-gray-600"
                            }`}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-xs text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/colleges/${collegeId}/students/${student._id}/edit`
                                  )
                                }
                                className="h-7 w-7 rounded-full"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteClick(
                                    student._id,
                                    student.full_name,
                                    student.matric_no
                                  )
                                }
                                className="h-7 w-7 rounded-full"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} students
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="h-8 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="h-8 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

        {/* Empty State */}
        {!loading &&
          !initialLoad &&
          !isRefreshing &&
          !isDeleting &&
          students.length === 0 && (
            <Card className="p-8 border shadow-none">
              <div className="text-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  No students found
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {searchQuery || levelFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by uploading students to this department"}
                </p>
                {!searchQuery && levelFilter === "all" && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/colleges/${collegeId}/students/upload`
                      )
                    }
                    className="h-9"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2" />
                    Upload Students
                  </Button>
                )}
              </div>
            </Card>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        itemName={studentToDelete?.name}
        itemIdentifier={studentToDelete?.matric}
      />
    </div>
  );
}
