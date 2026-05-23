import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentsOverview } from "./types";

type StudentsRegistryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selectedCollegeId: string;
  onCollegeChange: (value: string) => void;
  selectedDepartmentId: string;
  onDepartmentChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  facial: string;
  onFacialChange: (value: string) => void;
  canManageStudents: boolean;
  selectedCount: number;
  isBulkUpdating: boolean;
  onBulkActive: () => void;
  onBulkInactive: () => void;
  overview: StudentsOverview | null;
  showCollegeFilter?: boolean;
  showDepartmentFilter?: boolean;
  showLevelFilter?: boolean;
  showFaceFilter?: boolean;
};

export function StudentsRegistryFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search name, email, or identifier",
  selectedCollegeId,
  onCollegeChange,
  selectedDepartmentId,
  onDepartmentChange,
  level,
  onLevelChange,
  status,
  onStatusChange,
  facial,
  onFacialChange,
  canManageStudents,
  selectedCount,
  isBulkUpdating,
  onBulkActive,
  onBulkInactive,
  overview,
  showCollegeFilter = true,
  showDepartmentFilter = true,
  showLevelFilter = true,
  showFaceFilter = true,
}: StudentsRegistryFiltersProps) {
  const collegeOptions = overview?.colleges || [];
  const departmentOptions =
    selectedCollegeId !== "all"
      ? collegeOptions.find((college) => college.id === selectedCollegeId)
          ?.departments || []
      : collegeOptions.flatMap((college) => college.departments);
  const levelOptions = overview?.levels || [];
  const selectedCollegeLabel =
    selectedCollegeId !== "all"
      ? collegeOptions.find((college) => college.id === selectedCollegeId)?.code
      : undefined;
  const selectedDepartmentLabel =
    selectedDepartmentId !== "all"
      ? departmentOptions.find((department) => department.id === selectedDepartmentId)
          ?.code
      : undefined;

  return (
    <Card className="border shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-6">
          <div className="relative min-w-0 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 min-w-0 pl-8 pr-2 text-sm"
            />
          </div>

          {showCollegeFilter ? (
            <Select value={selectedCollegeId} onValueChange={onCollegeChange}>
              <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
                <SelectValue placeholder="College">
                  {selectedCollegeLabel || "College"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {collegeOptions.map((college) => (
                  <SelectItem
                    key={college.id}
                    value={college.id}
                    className="max-w-[320px] truncate"
                  >
                    {college.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {showDepartmentFilter ? (
            <Select
              value={selectedDepartmentId}
              onValueChange={onDepartmentChange}
            >
              <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
                <SelectValue placeholder="Department">
                  {selectedDepartmentLabel || "Department"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((department) => (
                  <SelectItem
                    key={department.id}
                    value={department.id}
                    className="max-w-[320px] truncate"
                  >
                    {department.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {showLevelFilter ? (
            <Select value={level} onValueChange={onLevelChange}>
              <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levelOptions.map((levelOption) => (
                  <SelectItem key={levelOption} value={levelOption}>
                    {levelOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {showFaceFilter ? (
            <Select value={facial} onValueChange={onFacialChange}>
              <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
                <SelectValue placeholder="Facial Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facial Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="not-registered">Not Registered</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {canManageStudents && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-2">
            <p className="text-xs text-muted-foreground">
              {selectedCount} selected
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={selectedCount === 0 || isBulkUpdating}
              onClick={onBulkActive}
            >
              Mark Active
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={selectedCount === 0 || isBulkUpdating}
              onClick={onBulkInactive}
            >
              Mark Inactive
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
