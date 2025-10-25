"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Users,
  GraduationCap,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";

export default function CollegesPage() {
  const router = useRouter();
  const { token, admin } = useAuthStore();
  const {
    colleges,
    statistics,
    loading,
    error,
    fetchColleges,
    fetchStatistics,
    deleteCollege,
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

  const isSuperAdmin = admin?.role === "super_admin";

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

  const handleDeleteClick = (
    collegeId: string,
    collegeName: string,
    collegeCode: string
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Colleges & Departments
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage academic colleges and their departments
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                onClick={() => router.push("/dashboard/colleges/create")}
                className="h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Create College
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.total_colleges}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Colleges
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.total_departments}
                  </p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.total_students}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Students
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.active_colleges}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Colleges
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-3 border shadow-none">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search colleges by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
                className="h-9 text-xs"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                size="sm"
                className="h-9 text-xs"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
                size="sm"
                className="h-9 text-xs text-muted-foreground"
              >
                Inactive
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

        {/* Loading State */}
        {(loading || initialLoad) && colleges.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Colleges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredColleges.map((college) => (
            <Card
              key={college._id}
              className="p-4 border shadow-none hover:shadow-md hover:border-primary/50 transition-all"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs font-semibold text-primary">
                        {college.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {college.name}
                    </h3>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      college.is_active
                        ? "bg-green-500/10 text-green-600"
                        : "bg-gray-500/10 text-gray-600"
                    }`}
                  >
                    {college.is_active ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {college.departments.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Departments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {college.student_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>
                </div>

                {/* Dean Info */}
                {college.dean_name && (
                  <div className="pt-2.5 border-t">
                    <p className="text-xs text-muted-foreground">Dean</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {college.dean_name}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() =>
                      router.push(`/dashboard/colleges/${college._id}`)
                    }
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View
                  </Button>

                  {isSuperAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() =>
                          router.push(`/dashboard/colleges/${college._id}/edit`)
                        }
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() =>
                          handleDeleteClick(
                            college._id,
                            college.name,
                            college.code
                          )
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!loading && !initialLoad && filteredColleges.length === 0 && (
          <Card className="p-8 border shadow-none">
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
              {isSuperAdmin && !searchQuery && statusFilter === "all" && (
                <Button
                  onClick={() => router.push("/dashboard/colleges/create")}
                  className="h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Create College
                </Button>
              )}
            </div>
          </Card>
        )}
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
    </div>
  );
}
