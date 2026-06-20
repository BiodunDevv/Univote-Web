import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DepartmentFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  collegeId: string;
  onCollegeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  colleges: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

export function DepartmentFilters({
  search,
  onSearchChange,
  collegeId,
  onCollegeChange,
  status,
  onStatusChange,
  colleges,
}: DepartmentFiltersProps) {
  const selectedCollegeCode =
    collegeId !== "all"
      ? colleges.find((college) => college.id === collegeId)?.code
      : undefined;

  return (
    <Card className="border shadow-none">
      <CardContent className="p-3">
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_8rem]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by department, code, or college"
              className="h-9 min-w-0 pl-8 pr-2 text-sm"
            />
          </div>

          <Select value={collegeId} onValueChange={onCollegeChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm [&>span]:truncate">
              <SelectValue placeholder="College">
                {selectedCollegeCode || "College"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map((college) => (
                <SelectItem
                  key={college.id}
                  value={college.id}
                  className="max-w-[320px]"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{college.code}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {college.name}
                    </span>
                  </span>
                </SelectItem>
              ))}
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
        </div>
      </CardContent>
    </Card>
  );
}
