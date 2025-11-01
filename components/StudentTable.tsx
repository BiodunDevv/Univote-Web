"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Student } from "@/types/student";

interface StudentTableProps {
  students: Student[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  collegeId: string;
  isSuperAdmin: boolean;
  showDepartment?: boolean;
  onDelete: (id: string, name: string, matric: string) => void;
  onPageChange: (page: number) => void;
}

export function StudentTable({
  students,
  pagination,
  collegeId,
  isSuperAdmin,
  showDepartment = false,
  onDelete,
  onPageChange,
}: StudentTableProps) {
  const router = useRouter();

  return (
    <>
      <Card className="border shadow-none py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-xs">#</TableHead>
              <TableHead className="text-xs">Student</TableHead>
              <TableHead className="text-xs">Matric No</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              {showDepartment && (
                <TableHead className="text-xs">Department</TableHead>
              )}
              <TableHead className="text-xs">Level</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              {isSuperAdmin && (
                <TableHead className="text-right text-xs">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={student._id}>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {(pagination.page - 1) * pagination.limit + index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-muted border-2 border-border">
                      {student.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-xs">${student.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-xs">
                          {student.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}
                      {student.has_facial_data && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                          <span className="text-[7px] text-white">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {student.full_name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono font-semibold text-primary text-xs">
                  {student.matric_no}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {student.email}
                </TableCell>
                {showDepartment && (
                  <TableCell className="text-foreground text-xs">
                    {student.department}
                  </TableCell>
                )}
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {student.level}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      student.is_active
                        ? "bg-green-500/10 text-green-600"
                        : "bg-gray-500/10 text-gray-600"
                    }`}
                  >
                    {student.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/dashboard/colleges/${collegeId}/students/${student._id}`
                          )
                        }
                        title="View Details"
                        className="h-7 w-7 rounded-full"
                      >
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/dashboard/colleges/${collegeId}/students/${student._id}/edit`
                          )
                        }
                        title="Edit Student"
                        className="h-7 w-7 rounded-full"
                      >
                        <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onDelete(
                            student._id,
                            student.full_name,
                            student.matric_no
                          )
                        }
                        title="Delete Student"
                        className="h-7 w-7 rounded-full"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} students
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 text-xs flex-1 sm:flex-initial"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="h-8 text-xs flex-1 sm:flex-initial"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
