import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Department {
  _id: string;
  name: string;
  code: string;
  collegeName?: string;
}

interface College {
  _id: string;
  name: string;
  code: string;
  departments?: Department[];
}

interface DepartmentSelectorProps {
  colleges: College[];
  departments: Department[];
  selectedDepartmentIds: string[];
  onDepartmentChange: (departmentId: string) => void;
  onSelectAllDepartments: () => void;
  loading?: boolean;
}

export default function DepartmentSelector({
  colleges,
  departments,
  selectedDepartmentIds,
  onDepartmentChange,
  onSelectAllDepartments,
  loading = false,
}: DepartmentSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </div>
          <Label className="text-xs sm:text-sm font-medium text-foreground">
            Select Departments
          </Label>
          <span className="text-[10px] text-muted-foreground">
            ({selectedDepartmentIds.length} selected)
          </span>
        </div>
        {departments.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSelectAllDepartments}
            className="h-7 px-2 text-[10px] sm:text-xs"
          >
            {selectedDepartmentIds.length === departments.length
              ? "Clear All"
              : "Select All"}
          </Button>
        )}
      </div>
      {loading || departments.length === 0 ? (
        <div className="p-4 border-2 border-dashed rounded-lg text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Loading departments...
          </p>
        </div>
      ) : (
        <>
          {/* Group by College */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto p-3 bg-muted/20 rounded-lg border">
            {colleges.map((college) => {
              const collegeDepts = departments.filter(
                (dept) => dept.collegeName === college.name
              );
              if (collegeDepts.length === 0) return null;

              const selectedInCollege = collegeDepts.filter((dept) =>
                selectedDepartmentIds.includes(dept._id)
              ).length;

              return (
                <div key={college._id} className="space-y-2">
                  {/* College Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400">
                        {college.code}
                      </span>
                      <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-300 hidden sm:inline">
                        {college.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">
                      {selectedInCollege}/{collegeDepts.length}
                    </span>
                  </div>
                  {/* Departments Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
                    {collegeDepts.map((department) => (
                      <button
                        key={department._id}
                        type="button"
                        onClick={() => onDepartmentChange(department._id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all border ${
                          selectedDepartmentIds.includes(department._id)
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedDepartmentIds.includes(department._id)
                              ? "border-white"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedDepartmentIds.includes(department._id) && (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1 truncate">
                          {department.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {selectedDepartmentIds.length > 0
              ? `✓ Selected ${selectedDepartmentIds.length} department(s)`
              : "Choose departments to see available levels"}
          </p>
        </>
      )}
    </div>
  );
}
