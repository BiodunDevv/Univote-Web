"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, FileText, Upload } from "lucide-react";
import type { StudentCSVData } from "@/types/student";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StudentsOverviewLite = {
  colleges: Array<{
    id: string;
    name: string;
    departments: Array<{
      id: string;
      name: string;
    }>;
  }>;
};

type CreateStudentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview: StudentsOverviewLite | null;
  initialMode?: Mode;
  isSubmitting?: boolean;
  submitError?: string | null;
  onCreateManual: (payload: StudentCSVData) => Promise<void>;
  onCreateBulk: (
    csvData: StudentCSVData[],
    target?: { college?: string; department?: string; level?: string },
  ) => Promise<void>;
};

type Mode = "manual" | "bulk";

type BulkValidationIssue = {
  row: number;
  message: string;
};

const emptyManualForm = {
  matric_no: "",
  full_name: "",
  email: "",
  collegeId: "",
  departmentId: "",
  level: "100",
  photo_url: "",
};

export function CreateStudentModal({
  open,
  onOpenChange,
  overview,
  initialMode = "manual",
  isSubmitting,
  submitError,
  onCreateManual,
  onCreateBulk,
}: CreateStudentModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [bulkRows, setBulkRows] = useState<StudentCSVData[]>([]);
  const [targetCollegeId, setTargetCollegeId] = useState("all");
  const [targetDepartmentId, setTargetDepartmentId] = useState("all");
  const [targetLevel, setTargetLevel] = useState("all");
  const [localError, setLocalError] = useState<string | null>(null);
  const [bulkValidationIssues, setBulkValidationIssues] = useState<
    BulkValidationIssue[]
  >([]);

  const activeCollege = useMemo(
    () =>
      overview?.colleges.find(
        (college) => college.id === manualForm.collegeId,
      ) || null,
    [overview?.colleges, manualForm.collegeId],
  );

  const activeBulkCollege = useMemo(
    () =>
      overview?.colleges.find((college) => college.id === targetCollegeId) ||
      null,
    [overview?.colleges, targetCollegeId],
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode(initialMode);
      setManualForm(emptyManualForm);
      setBulkRows([]);
      setTargetCollegeId("all");
      setTargetDepartmentId("all");
      setTargetLevel("all");
      setLocalError(null);
      setBulkValidationIssues([]);
    }
    onOpenChange(nextOpen);
  };
  const parseCsv = (
    text: string,
  ): { rows: StudentCSVData[]; issues: BulkValidationIssue[] } => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => Boolean(line) && !line.startsWith("#"));

    if (lines.length < 2) {
      throw new Error("CSV must include headers and at least one row.");
    }

    if (lines[0].includes(";") && !lines[0].includes(",")) {
      throw new Error("Use comma-separated CSV files. Semicolon-delimited files are not supported.");
    }

    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().toLowerCase());
    const required = ["matric_no", "full_name", "email"];
    const missing = required.filter((key) => !headers.includes(key));

    if (missing.length > 0) {
      throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
    }

    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((value) => value.trim());
      const get = (key: string) => values[headers.indexOf(key)] || "";

      return {
        matric_no: get("matric_no").toUpperCase(),
        full_name: get("full_name"),
        email: get("email"),
        college: get("college") || undefined,
        department: get("department") || undefined,
        level: get("level") || undefined,
        photo_url: get("photo_url") || undefined,
      };
    });

    const issues: BulkValidationIssue[] = [];
    const seenMatricNumbers = new Set<string>();
    const emailPattern = /\S+@\S+\.\S+/;
    const allowedLevels = new Set(["100", "200", "300", "400", "500", "600"]);

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      if (!row.matric_no) {
        issues.push({ row: rowNumber, message: "Missing matric_no" });
      } else if (seenMatricNumbers.has(row.matric_no)) {
        issues.push({
          row: rowNumber,
          message: `Duplicate matric_no '${row.matric_no}' in this file`,
        });
      } else {
        seenMatricNumbers.add(row.matric_no);
      }

      if (!row.full_name) {
        issues.push({ row: rowNumber, message: "Missing full_name" });
      }

      if (!row.email) {
        issues.push({ row: rowNumber, message: "Missing email" });
      } else if (!emailPattern.test(row.email)) {
        issues.push({
          row: rowNumber,
          message: `Invalid email '${row.email}'`,
        });
      }

      if (row.level && !allowedLevels.has(row.level)) {
        issues.push({
          row: rowNumber,
          message: `Invalid level '${row.level}'. Use 100, 200, 300, 400, 500, or 600.`,
        });
      }
    });

    return { rows, issues };
  };

  const downloadTemplate = () => {
    const sampleCollege = overview?.colleges[0];
    const sampleDepartment = sampleCollege?.departments[0];
    const csv = [
      "# Template notes:",
      "# 1. Keep the header row unchanged.",
      "# 2. matric_no, full_name, and email are required.",
      "# 3. level must be one of 100, 200, 300, 400, 500, 600.",
      "# 4. college, department, and level may be left blank only if you will apply overrides in this dialog.",
      "matric_no,full_name,email,college,department,level,photo_url",
      [
        "BU22CSC1001",
        "Ada Lovelace",
        "ada.lovelace@example.edu",
        sampleCollege?.name || "College of Science",
        sampleDepartment?.name || "Computer Science",
        "300",
        "https://example.com/ada-lovelace.jpg",
      ].join(","),
      [
        "BU22CSC1002",
        "Grace Hopper",
        "grace.hopper@example.edu",
        sampleCollege?.name || "College of Science",
        sampleDepartment?.name || "Computer Science",
        "400",
        "",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "univote-student-upload-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readEvent) => {
      try {
        const parsed = parseCsv(String(readEvent.target?.result || ""));
        setBulkRows(parsed.rows);
        setBulkValidationIssues(parsed.issues);
        setLocalError(
          parsed.issues.length > 0
            ? `Found ${parsed.issues.length} validation issue(s). Fix the file and upload again.`
            : null,
        );
      } catch (error) {
        setBulkRows([]);
        setBulkValidationIssues([]);
        setLocalError(
          error instanceof Error ? error.message : "Failed to parse CSV file.",
        );
      }
    };
    reader.readAsText(file);
  };

  const submitManual = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!overview) return;

    const selectedCollege = overview.colleges.find(
      (college) => college.id === manualForm.collegeId,
    );

    const selectedDepartment = selectedCollege?.departments.find(
      (department) => department.id === manualForm.departmentId,
    );

    if (!selectedCollege || !selectedDepartment) {
      setLocalError("Select a valid college and department.");
      return;
    }

    setLocalError(null);

    await onCreateManual({
      matric_no: manualForm.matric_no.trim().toUpperCase(),
      full_name: manualForm.full_name.trim(),
      email: manualForm.email.trim().toLowerCase(),
      college: selectedCollege.name,
      department: selectedDepartment.name,
      level: manualForm.level,
      photo_url: manualForm.photo_url.trim() || undefined,
    });
  };

  const submitBulk = async () => {
    if (bulkRows.length === 0 || !overview || bulkValidationIssues.length > 0) {
      return;
    }

    const selectedCollege =
      targetCollegeId !== "all"
        ? overview.colleges.find((college) => college.id === targetCollegeId)
        : undefined;

    const selectedDepartment =
      targetDepartmentId !== "all"
        ? selectedCollege?.departments.find(
            (department) => department.id === targetDepartmentId,
          )
        : undefined;

    setLocalError(null);

    await onCreateBulk(bulkRows, {
      college: selectedCollege?.name,
      department: selectedDepartment?.name,
      level: targetLevel !== "all" ? targetLevel : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Students</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
            <Button
              type="button"
              variant={mode === "manual" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => {
                setMode("manual");
                setLocalError(null);
              }}
            >
              Manual Entry
            </Button>
            <Button
              type="button"
              variant={mode === "bulk" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => {
                setMode("bulk");
                setLocalError(null);
              }}
            >
              Bulk Upload
            </Button>
          </div>

          {(submitError || localError) && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">
                {submitError || localError}
              </p>
            </div>
          )}

          {mode === "manual" ? (
            <form onSubmit={submitManual} className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Matric Number</Label>
                  <Input
                    value={manualForm.matric_no}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        matric_no: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={manualForm.full_name}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        full_name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={manualForm.email}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">College</Label>
                  <Select
                    value={manualForm.collegeId}
                    onValueChange={(value) =>
                      setManualForm((prev) => ({
                        ...prev,
                        collegeId: value,
                        departmentId: "",
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      {(overview?.colleges || []).map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Select
                    value={manualForm.departmentId}
                    onValueChange={(value) =>
                      setManualForm((prev) => ({
                        ...prev,
                        departmentId: value,
                      }))
                    }
                    disabled={!activeCollege}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activeCollege?.departments || []).map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Level</Label>
                  <Select
                    value={manualForm.level}
                    onValueChange={(value) =>
                      setManualForm((prev) => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="300">300</SelectItem>
                      <SelectItem value="400">400</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="600">600</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Photo URL</Label>
                  <Input
                    value={manualForm.photo_url}
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        photo_url: event.target.value,
                      }))
                    }
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={Boolean(isSubmitting)}>
                  {isSubmitting ? "Creating..." : "Create Student"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs">CSV File</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={downloadTemplate}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download template
                  </Button>
                </div>
                <Input type="file" accept=".csv" onChange={handleCsvUpload} className="h-9" />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Select
                  value={targetCollegeId}
                  onValueChange={(value) => {
                    setTargetCollegeId(value);
                    setTargetDepartmentId("all");
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="College Override" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Use CSV College</SelectItem>
                    {(overview?.colleges || []).map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={targetDepartmentId}
                  onValueChange={setTargetDepartmentId}
                  disabled={targetCollegeId === "all"}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Department Override" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Use CSV Department</SelectItem>
                    {(activeBulkCollege?.departments || []).map(
                      (department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Select value={targetLevel} onValueChange={setTargetLevel}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Level Override" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Use CSV Level</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{bulkRows.length} row(s) parsed</span>
              </div>

              {bulkValidationIssues.length > 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">
                    Validation issues
                  </p>
                  <div className="mt-2 space-y-1">
                    {bulkValidationIssues.slice(0, 8).map((issue, index) => (
                      <p key={`${issue.row}-${index}`} className="text-xs text-destructive">
                        Row {issue.row}: {issue.message}
                      </p>
                    ))}
                    {bulkValidationIssues.length > 8 ? (
                      <p className="text-xs text-destructive">
                        ...and {bulkValidationIssues.length - 8} more issue(s)
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={
                    bulkRows.length === 0 ||
                    bulkValidationIssues.length > 0 ||
                    Boolean(isSubmitting)
                  }
                  onClick={() => void submitBulk()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Uploading..." : "Upload Students"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
