"use client";

import {
  Building2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { College } from "./types";

type CollegeCardProps = {
  college: College;
  isSuperAdmin?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (college: College) => void;
};

export function CollegeCard({
  college,
  isSuperAdmin,
  onView,
  onEdit,
  onDelete,
}: CollegeCardProps) {
  return (
    <Card className="border shadow-none transition-colors hover:border-primary/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="font-mono text-[10px]">
                {college.code}
              </Badge>
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
              {college.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                college.is_active ? "bg-emerald-500/10 text-emerald-700" : ""
              }
            >
              {college.is_active ? "Active" : "Inactive"}
            </Badge>
            {isSuperAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(college._id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(college)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {college.dean_name && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            Dean:{" "}
            <span className="font-medium text-foreground">
              {college.dean_name}
            </span>
          </p>
        )}

        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2.5 py-2">
          <p className="text-xs text-muted-foreground">
            {college.departments.length} department
            {college.departments.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{college.student_count.toLocaleString()}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => onView(college._id)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View College
        </Button>
      </CardContent>
    </Card>
  );
}
