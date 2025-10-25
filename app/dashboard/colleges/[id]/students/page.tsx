"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Users,
  Search,
  Upload,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useStudentStore } from "@/lib/store/useStudentStore";

export default function CollegeStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const { token, admin } = useAuthStore();
  const { currentCollege, fetchCollegeById } = useCollegeStore();
  const {
    students,
    loading,
    error,
    pagination,
    fetchStudentsByCollege,
    deleteStudent,
  } = useStudentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
    matric: string;
  } | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = admin?.role === "super_admin";

  // Load college and students
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCollegeById(token || undefined, collegeId),
        fetchStudentsByCollege(token || undefined, collegeId, {
          page: 1,
          limit: 50,
        }),
      ]);
      setInitialLoad(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Handle filter changes
  const handleFilterChange = async () => {
    setIsRefreshing(true);
    await fetchStudentsByCollege(token || undefined, collegeId, {
      department: departmentFilter !== "all" ? departmentFilter : undefined,
      level: levelFilter !== "all" ? levelFilter : undefined,
      search: searchQuery || undefined,
      page: 1,
      limit: 50,
    });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    if (!initialLoad) {
      handleFilterChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, departmentFilter, levelFilter]);

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
      await fetchStudentsByCollege(token, collegeId, {
        department: departmentFilter !== "all" ? departmentFilter : undefined,
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
    fetchStudentsByCollege(token || undefined, collegeId, {
      department: departmentFilter !== "all" ? departmentFilter : undefined,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/colleges/${collegeId}`)}
                className="rounded-full hover:bg-accent h-9 w-9"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentCollege?.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {pagination.total} students
                </p>
              </div>
            </div>
            {isSuperAdmin && (
              <Button
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/colleges/${collegeId}/students/upload`
                  )
                }
                className="h-9"
              >
                <Upload className="w-3.5 h-3.5 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        {/* Filters */}
        <Card className="p-3 border shadow-none">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background text-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Departments</option>
                {currentCollege?.departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Levels</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
              </select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFilterChange()}
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <RefreshCw
                  className={`w-4 h-4 transition-transform duration-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-3 border-destructive/50 bg-destructive/5 shadow-none">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
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
            <div className="flex items-center justify-center py-16">
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
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Matric No
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Department
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Level
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Status
                      </th>
                      {isSuperAdmin && (
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-primary text-xs">
                          {student.matric_no}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {student.full_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {student.department}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {student.level}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.is_active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-gray-500/10 text-gray-600"
                            }`}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/colleges/${collegeId}/students/${student._id}/edit`
                                  )
                                }
                                className="h-8 w-8 rounded-full hover:bg-accent"
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
                                className="h-8 w-8 rounded-full hover:bg-accent"
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
                <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="h-8 px-3 text-xs rounded-full"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="h-8 px-3 text-xs rounded-full"
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
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No students found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ||
                  departmentFilter !== "all" ||
                  levelFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by uploading students"}
                </p>
                {!searchQuery &&
                  departmentFilter === "all" &&
                  levelFilter === "all" &&
                  isSuperAdmin && (
                    <Button
                      size="sm"
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
