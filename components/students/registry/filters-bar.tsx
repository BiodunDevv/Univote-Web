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
  isSuperAdmin: boolean;
  selectedCount: number;
  isBulkUpdating: boolean;
  onBulkActive: () => void;
  onBulkInactive: () => void;
  overview: StudentsOverview | null;
};

export function StudentsRegistryFilters({
  search,
  onSearchChange,
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
  isSuperAdmin,
  selectedCount,
  isBulkUpdating,
  onBulkActive,
  onBulkInactive,
  overview,
}: StudentsRegistryFiltersProps) {
  const activeCollege =
    overview?.colleges.find((college) => college.id === selectedCollegeId) ||
    null;

  return (
    <Card className="border shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-6">
          <div className="relative min-w-0 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, email, or matric no"
              className="h-9 min-w-0 pl-8 pr-2 text-sm"
            />
          </div>

          <Select value={selectedCollegeId} onValueChange={onCollegeChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
              <SelectValue placeholder="College" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {(overview?.colleges || []).map((college) => (
                <SelectItem
                  key={college.id}
                  value={college.id}
                  className="max-w-[320px] truncate"
                >
                  {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartmentId}
            onValueChange={onDepartmentChange}
          >
            <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {(activeCollege?.departments || []).map((department) => (
                <SelectItem
                  key={department.id}
                  value={department.id}
                  className="max-w-[320px] truncate"
                >
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={onLevelChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="300">300</SelectItem>
              <SelectItem value="400">400</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="600">600</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {isSuperAdmin && (
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
