"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Department } from "./types";

type DeptCardProps = {
  department: Department;
  showActions?: boolean;
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
};

export function DeptCard({
  department,
  showActions,
  onEdit,
  onDelete,
}: DeptCardProps) {
  return (
    <Card className="border shadow-none transition-colors hover:border-primary/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {department.code}
              </Badge>
              <Badge
                variant="outline"
                className={
                  department.is_active
                    ? "bg-emerald-500/10 text-emerald-700"
                    : ""
                }
              >
                {department.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
              {department.name}
            </h3>
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(department)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(department)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {department.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {department.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {department.available_levels.map((level) => (
              <Badge key={level} variant="secondary" className="text-[10px]">
                {level}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{(department.student_count || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
