"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  GraduationCap,
  Users,
  Edit,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { StatCard, PageHeader, DepartmentCard } from "@/components/College";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";

export default function CollegeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const { token, admin } = useAuthStore();
  const {
    currentCollege,
    loading,
    error,
    fetchCollegeById,
    addDepartment,
    deleteDepartment,
  } = useCollegeStore();

  const [showAddDept, setShowAddDept] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newDept, setNewDept] = useState({
    name: "",
    code: "",
    description: "",
    hod_name: "",
    hod_email: "",
    available_levels: ["100", "200", "300", "400"],
  });

  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    if (collegeId) {
      fetchCollegeById(token || undefined, collegeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const availableLevelOptions = [
    { value: "100", label: "100" },
    { value: "200", label: "200" },
    { value: "300", label: "300" },
    { value: "400", label: "400" },
    { value: "500", label: "500" },
    { value: "600", label: "600" },
  ];

  const toggleLevel = (level: string) => {
    setNewDept((prev) => ({
      ...prev,
      available_levels: prev.available_levels.includes(level)
        ? prev.available_levels.filter((l) => l !== level)
        : [...prev.available_levels, level].sort(),
    }));
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await addDepartment(token, collegeId, newDept);
      setShowAddDept(false);
      setNewDept({
        name: "",
        code: "",
        description: "",
        hod_name: "",
        hod_email: "",
        available_levels: ["100", "200", "300", "400"],
      });
      // Refresh data
      fetchCollegeById(token || undefined, collegeId);
    } catch {
      // Error handled by store
    }
  };

  const handleDeleteClick = (
    deptId: string,
    deptName: string,
    deptCode: string
  ) => {
    setDepartmentToDelete({ id: deptId, name: deptName, code: deptCode });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete || !token) return;

    setIsDeleting(true);
    try {
      // Use force=true since user confirmed with code
      await deleteDepartment(token, collegeId, departmentToDelete.id, true);
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
      await fetchCollegeById(token || undefined, collegeId);
    } catch {
      // Error handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !currentCollege) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentCollege) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            College not found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The college you&apos;re looking for doesn&apos;t exist.
          </p>
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
        title={currentCollege.name}
        subtitle={currentCollege.description}
        onBack={() => router.push("/dashboard/colleges")}
        hideTitleOnMobile={true}
        badges={
          <>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-mono font-semibold">
              {currentCollege.code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                currentCollege.is_active
                  ? "bg-green-500/10 text-green-600"
                  : "bg-gray-500/10 text-gray-600"
              }`}
            >
              {currentCollege.is_active ? "Active" : "Inactive"}
            </span>
          </>
        }
        actions={
          isSuperAdmin ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/colleges/${collegeId}/students`)
                  }
                  className="h-8 sm:h-9 text-xs"
                >
                  <Users className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="inline">View All Students</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/colleges/${collegeId}/edit`)
                  }
                  className="h-8 sm:h-9 text-xs"
                >
                  <Edit className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="inline">Edit</span>
                </Button>
              </div>
            </>
          ) : undefined
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
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

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            icon={GraduationCap}
            value={currentCollege.departments.length}
            label="Departments"
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatCard
            icon={Users}
            value={currentCollege.student_count}
            label="Students"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-500/10"
          />
          <StatCard
            icon={User}
            value={currentCollege.dean_name || "Not assigned"}
            label="Dean"
            iconColor="text-green-600"
            iconBgColor="bg-green-500/10"
          />
        </div>

        {/* Dean Information */}
        {(currentCollege.dean_name || currentCollege.dean_email) && (
          <Card className="p-3 sm:p-4 border shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                Dean Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {currentCollege.dean_name && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Full Name
                  </Label>
                  <p className="text-sm text-foreground mt-1">
                    {currentCollege.dean_name}
                  </p>
                </div>
              )}
              {currentCollege.dean_email && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Email
                  </Label>
                  <p className="text-sm text-foreground mt-1 break-all">
                    {currentCollege.dean_email}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Departments */}
        <Card className="p-4 border shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Departments
              </h2>
              <span className="text-xs text-muted-foreground">
                ({currentCollege.departments.length})
              </span>
            </div>
            {isSuperAdmin && (
              <Button
                size="sm"
                onClick={() => setShowAddDept(!showAddDept)}
                className="h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Add Department
              </Button>
            )}
          </div>

          {/* Add Department Form */}
          {showAddDept && (
            <form
              onSubmit={handleAddDepartment}
              className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3"
            >
              <h3 className="font-semibold text-foreground text-sm">
                New Department
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Department Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newDept.name}
                    onChange={(e) =>
                      setNewDept({ ...newDept, name: e.target.value })
                    }
                    placeholder="e.g., Computer Science"
                    required
                    className="bg-background h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newDept.code}
                    onChange={(e) =>
                      setNewDept({
                        ...newDept,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., CSC"
                    required
                    className="bg-background uppercase h-9 text-sm"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={newDept.description}
                  onChange={(e) =>
                    setNewDept({ ...newDept, description: e.target.value })
                  }
                  placeholder="Brief description of the department..."
                  className="bg-background h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    HOD Name
                  </Label>
                  <Input
                    value={newDept.hod_name}
                    onChange={(e) =>
                      setNewDept({ ...newDept, hod_name: e.target.value })
                    }
                    placeholder="e.g., Dr. John Doe"
                    className="bg-background h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    HOD Email
                  </Label>
                  <Input
                    value={newDept.hod_email}
                    onChange={(e) =>
                      setNewDept({ ...newDept, hod_email: e.target.value })
                    }
                    placeholder="hod@bowenuniversity.edu.ng"
                    type="email"
                    className="bg-background h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Available Levels
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {availableLevelOptions.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => toggleLevel(level.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        newDept.available_levels.includes(level.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="h-9"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Department"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDept(false)}
                  className="h-9"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Departments List */}
          {currentCollege.departments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No departments yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentCollege.departments.map((dept) => (
                <DepartmentCard
                  key={dept._id}
                  department={dept}
                  showActions={isSuperAdmin}
                  onViewStudents={() =>
                    router.push(
                      `/dashboard/colleges/${collegeId}/departments/${dept._id}/students`
                    )
                  }
                  onEdit={
                    isSuperAdmin
                      ? () =>
                          router.push(
                            `/dashboard/colleges/${collegeId}/departments/${dept._id}/edit`
                          )
                      : undefined
                  }
                  onDelete={
                    isSuperAdmin
                      ? () => handleDeleteClick(dept._id, dept.name, dept.code)
                      : undefined
                  }
                  onViewDetails={() =>
                    router.push(
                      `/dashboard/colleges/${collegeId}/departments/${dept._id}/students`
                    )
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteDepartmentDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        departmentName={departmentToDelete?.name}
        departmentCode={departmentToDelete?.code}
        isDeleting={isDeleting}
      />
    </div>
  );
}
