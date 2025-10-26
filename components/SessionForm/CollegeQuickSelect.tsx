import { Label } from "@/components/ui/label";

interface College {
  _id: string;
  name: string;
  code: string;
  departments?: Array<{ _id: string; name: string; code: string }>;
}

interface CollegeQuickSelectProps {
  colleges: College[];
  selectedDepartmentIds: string[];
  onCollegeClick: (collegeId: string) => void;
}

export default function CollegeQuickSelect({
  colleges,
  selectedDepartmentIds,
  onCollegeClick,
}: CollegeQuickSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          Quick Select by College
        </Label>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          Tap to select all departments
        </span>
      </div>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {colleges.map((college) => {
          const collegeDeptIds = college.departments?.map((d) => d._id) || [];
          const isCollegeSelected =
            collegeDeptIds.length > 0 &&
            collegeDeptIds.every((dId) => selectedDepartmentIds.includes(dId));
          const partiallySelected =
            collegeDeptIds.length > 0 &&
            collegeDeptIds.some((dId) => selectedDepartmentIds.includes(dId)) &&
            !isCollegeSelected;

          return (
            <button
              key={college._id}
              type="button"
              onClick={() => onCollegeClick(college._id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs font-medium transition-all border-2 ${
                isCollegeSelected
                  ? "bg-blue-500 text-white border-blue-600 shadow-sm"
                  : partiallySelected
                  ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                  : "bg-card text-foreground border-border hover:bg-muted/50"
              }`}
              title={`${college.name} - ${collegeDeptIds.length} departments`}
            >
              <span className="font-bold">{college.code}</span>
              <span className="text-[10px] opacity-70 sm:hidden">
                {collegeDeptIds.length} depts
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground">
        💡 Blue = All selected, Light blue = Some selected
      </p>
    </div>
  );
}
