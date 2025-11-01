"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Users,
  Search,
  Upload,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { PageHeader } from "@/components/College";
import { StudentTable } from "@/components/StudentTable";
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
      <PageHeader
        title={currentCollege?.name || "College Students"}
        subtitle={`${pagination.total} students`}
        onBack={() => router.push(`/dashboard/colleges/${collegeId}`)}
        actions={
          isSuperAdmin ? (
            <Button
              size="sm"
              onClick={() =>
                router.push(`/dashboard/colleges/${collegeId}/students/upload`)
              }
              className="h-8 text-xs shrink-0"
            >
              <Upload className="w-3.5 h-3.5 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Upload</span>
              <span className="sm:hidden">📤</span>
            </Button>
          ) : undefined
        }
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-3">
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
            <StudentTable
              students={students}
              pagination={pagination}
              collegeId={collegeId}
              isSuperAdmin={isSuperAdmin}
              showDepartment={true}
              onDelete={handleDeleteClick}
              onPageChange={handlePageChange}
            />
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
