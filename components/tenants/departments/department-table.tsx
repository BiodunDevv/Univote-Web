"use client";

import * as React from "react";
import {
  Building2,
  Eye,
  Layers3,
  School2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { compactUi } from "@/lib/compact-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type DepartmentRow = {
  _id: string;
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
  college: {
    id: string;
    name: string;
    code: string;
  };
};

type DepartmentTableProps = {
  departments: DepartmentRow[];
  participantPluralLabel?: string;
  participantSingularLabel?: string;
  onViewStudents: (department: DepartmentRow) => void;
};

function formatLevels(levels: string[]) {
  return levels.length > 0 ? levels.join(", ") : "No level mapping";
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-border bg-muted/60 text-muted-foreground";
}

function DepartmentPreviewDrawer({
  department,
  open,
  onOpenChange,
  onViewStudents,
  participantPluralLabel,
  participantSingularLabel,
}: {
  department: DepartmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantPluralLabel?: string;
  participantSingularLabel?: string;
  onViewStudents: (department: DepartmentRow) => void;
}) {
  const isMobile = useIsMobile();

  if (!department) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent className={isMobile ? "max-h-[92vh]" : "h-screen w-full sm:max-w-lg"}>
        <DrawerHeader className="border-b border-border/70">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DrawerTitle className="text-base font-semibold">{department.name}</DrawerTitle>
              <DrawerDescription className="text-xs">
                {department.code} · {department.college.name}
              </DrawerDescription>
            </div>
            <Badge variant="outline" className={cn("text-xs", statusBadgeClass(department.is_active))}>
              {department.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>College</p>
              <div className="mt-2 flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{department.college.name}</p>
                  <p className={compactUi.typography.muted}>{department.college.code}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>Participant coverage</p>
              <div className="mt-2 flex items-start gap-2">
                <School2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">
                    {department.student_count.toLocaleString()}{" "}
                    {(participantPluralLabel || "Participants").toLowerCase()}
                  </p>
                  <p className={compactUi.typography.muted}>Current mapped headcount</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>Head of department</p>
              <div className="mt-2 flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">
                    {department.hod_name || "Not assigned"}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {department.hod_email || "No contact email provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className={compactUi.typography.eyebrow}>Available levels</p>
              <div className="mt-2 flex items-start gap-2">
                <Layers3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className={compactUi.typography.muted}>{formatLevels(department.available_levels)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {department.available_levels.length > 0 ? (
                      department.available_levels.map((level) => (
                        <Badge key={level} variant="secondary">
                          Level {level}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Not mapped</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className={compactUi.typography.sectionTitle}>Operational notes</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {department.description?.trim() || "No department description has been added yet."}
            </p>
          </div>
        </div>

        <DrawerFooter className="border-t border-border/70 bg-background sm:flex-row">
          <Button className="sm:flex-1" onClick={() => onViewStudents(department)}>
            View {participantPluralLabel || "participants"}
          </Button>
          <Button variant="outline" className="sm:flex-1" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function DepartmentTable({
  departments,
  participantPluralLabel = "Participants",
  onViewStudents,
}: DepartmentTableProps) {
  const [activeDepartment, setActiveDepartment] = React.useState<DepartmentRow | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const openPreview = (department: DepartmentRow) => {
    setActiveDepartment(department);
    setPreviewOpen(true);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{departments.length.toLocaleString()} departments loaded</span>
        <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
          {departments.filter((department) => department.is_active).length.toLocaleString()} active
        </span>
      </div>

      {departments.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department._id}
              className="rounded-xl border border-border/70 bg-background p-3 shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <button
                    type="button"
                    onClick={() => openPreview(department)}
                    className="block min-w-0 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">
                      {department.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{department.code}</p>
                  </button>
                  <p className="truncate text-xs text-muted-foreground">
                    {department.college.name}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-xs", statusBadgeClass(department.is_active))}>
                  {department.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                  <p className={compactUi.typography.eyebrow}>
                    {participantPluralLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {department.student_count.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                  <p className={compactUi.typography.eyebrow}>HOD</p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {department.hod_name || "Not assigned"}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {department.description?.trim() || "No department description has been added yet."}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {department.available_levels.length > 0 ? (
                  department.available_levels.map((level) => (
                    <Badge key={level} variant="secondary">
                      Level {level}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Not mapped</Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview(department)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button size="sm" onClick={() => onViewStudents(department)}>
                  <Users className="mr-2 h-4 w-4" />
                  View {participantPluralLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
          No departments found.
        </div>
      )}

      <DepartmentPreviewDrawer
        department={activeDepartment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        participantPluralLabel={participantPluralLabel}
        onViewStudents={onViewStudents}
      />
    </div>
  );
}
