"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AVAILABLE_LEVELS,
  type CollegeCreationFormData,
  type DepartmentFormData,
} from "../types";
import { toggleLevel } from "../utils";

type DepartmentsStepProps = {
  formData: CollegeCreationFormData;
  onAddDepartment: () => void;
  onRemoveDepartment: (index: number) => void;
  onUpdateDepartment: (
    index: number,
    field: keyof DepartmentFormData,
    value: string | string[],
  ) => void;
};

export function DepartmentsStep({
  formData,
  onAddDepartment,
  onRemoveDepartment,
  onUpdateDepartment,
}: DepartmentsStepProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Departments
            <Badge variant="secondary">{formData.departments.length}</Badge>
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={onAddDepartment}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {formData.departments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-10 text-center text-sm text-muted-foreground">
            No departments added yet. You can add them now or later.
          </div>
        ) : (
          formData.departments.map((department, index) => {
            const isOpen = expanded === index;
            return (
              <div key={index} className="rounded-lg border bg-muted/20">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-3 text-left"
                  onClick={() =>
                    setExpanded((prev) => (prev === index ? null : index))
                  }
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {department.code || `DPT-${index + 1}`}
                    </Badge>
                    <span className="truncate text-sm font-medium text-foreground">
                      {department.name || `Department ${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveDepartment(index);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Name
                        </Label>
                        <Input
                          value={department.name}
                          onChange={(event) =>
                            onUpdateDepartment(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Computer Science"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Code
                        </Label>
                        <Input
                          value={department.code}
                          onChange={(event) =>
                            onUpdateDepartment(
                              index,
                              "code",
                              event.target.value.toUpperCase(),
                            )
                          }
                          placeholder="CSC"
                          className="h-9 text-sm"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={department.description}
                        onChange={(event) =>
                          onUpdateDepartment(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          HOD Name
                        </Label>
                        <Input
                          value={department.hod_name}
                          onChange={(event) =>
                            onUpdateDepartment(
                              index,
                              "hod_name",
                              event.target.value,
                            )
                          }
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          HOD Email
                        </Label>
                        <Input
                          type="email"
                          value={department.hod_email}
                          onChange={(event) =>
                            onUpdateDepartment(
                              index,
                              "hod_email",
                              event.target.value,
                            )
                          }
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Available Levels
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {AVAILABLE_LEVELS.map((level) => {
                          const selected =
                            department.available_levels.includes(level);
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() =>
                                onUpdateDepartment(
                                  index,
                                  "available_levels",
                                  toggleLevel(
                                    department.available_levels,
                                    level,
                                  ),
                                )
                              }
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground"
                              }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
