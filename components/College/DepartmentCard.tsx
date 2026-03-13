import { Eye, GraduationCap, Pencil, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Department = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  student_count?: number;
};

type DepartmentCardProps = {
  department: Department;
  showActions?: boolean;
  onViewStudents?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
};

export function DepartmentCard({
  department,
  showActions,
  onViewStudents,
  onEdit,
  onDelete,
  onViewDetails,
}: DepartmentCardProps) {
  return (
    <Card className="border p-3 shadow-none sm:p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {department.code}
              </span>
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
              {department.name}
            </h3>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              department.is_active
                ? "bg-green-500/10 text-green-600"
                : "bg-gray-500/10 text-gray-600"
            }`}
          >
            {department.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {department.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {department.description}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{department.student_count || 0} Students</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={onViewDetails || onViewStudents}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>

          {showActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
