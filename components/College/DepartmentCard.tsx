import { Edit, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
  is_active: boolean;
  student_count: number;
  available_levels: string[];
}

interface DepartmentCardProps {
  department: Department;
  onViewStudents?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

export function DepartmentCard({
  department,
  onViewStudents,
  onEdit,
  onDelete,
  onViewDetails,
  showActions = true,
}: DepartmentCardProps) {
  return (
    <Card className="p-3 border shadow-none hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-xs font-semibold text-primary">
              {department.code}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                department.is_active
                  ? "bg-green-500/10 text-green-600"
                  : "bg-gray-500/10 text-gray-600"
              }`}
            >
              {department.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm">
            {department.name}
          </h3>
          {department.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {department.description}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex gap-1">
            {onViewStudents && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onViewStudents}
                title="View Students"
                className="h-8 w-8 rounded-full hover:bg-accent"
              >
                <Users className="w-3.5 h-3.5" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="Edit Department"
                className="h-8 w-8 rounded-full hover:bg-accent"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 rounded-full hover:bg-accent"
                title="Delete Department"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Students</span>
          <span className="font-semibold text-foreground">
            {department.student_count}
          </span>
        </div>

        {department.hod_name && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">HOD</p>
            <p className="text-sm font-medium text-foreground">
              {department.hod_name}
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1.5">Levels</p>
          <div className="flex flex-wrap gap-1">
            {department.available_levels.map((level) => (
              <span
                key={level}
                className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {level}
              </span>
            ))}
          </div>
        </div>

        {onViewDetails && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="w-full h-8 text-xs"
            >
              View Department
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
