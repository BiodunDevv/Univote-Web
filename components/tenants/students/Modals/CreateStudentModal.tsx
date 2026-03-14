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
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getTenantLoginIdentifier,
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
  isTenantParticipantFieldRequired,
} from "@/lib/tenant-config";
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
  member_id: "",
  employee_id: "",
  username: "",
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
  const { tenant } = useAuthStore();
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
  const participantLabels = getTenantParticipantLabels(tenant);
  const loginIdentifier = getTenantLoginIdentifier(tenant);
  const emailEnabled = isTenantParticipantFieldEnabled(tenant, "email");
  const emailRequired = isTenantParticipantFieldRequired(tenant, "email");
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const collegeRequired = isTenantParticipantFieldRequired(tenant, "college");
  const departmentEnabled = isTenantParticipantFieldEnabled(tenant, "department");
  const departmentRequired = isTenantParticipantFieldRequired(
    tenant,
    "department",
  );
  const levelEnabled = isTenantParticipantFieldEnabled(tenant, "level");
  const levelRequired = isTenantParticipantFieldRequired(tenant, "level");
  const photoEnabled = isTenantParticipantFieldEnabled(tenant, "photo_url");
  const primaryIdentifierKey = loginIdentifier.key as
    | "matric_no"
    | "member_id"
    | "employee_id"
    | "username";

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
    const required = [loginIdentifier.key, "full_name"];
    if (emailRequired) required.push("email");
    if (collegeRequired) required.push("college");
    if (departmentRequired) required.push("department");
    if (levelRequired) required.push("level");
    const missing = required.filter((key) => !headers.includes(key));

    if (missing.length > 0) {
      throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
    }

    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((value) => value.trim());
      const get = (key: string) => values[headers.indexOf(key)] || "";

      return {
        matric_no: get("matric_no").toUpperCase() || undefined,
        member_id: get("member_id").toUpperCase() || undefined,
        employee_id: get("employee_id").toUpperCase() || undefined,
        username: get("username").toLowerCase() || undefined,
        full_name: get("full_name"),
        email: emailEnabled ? get("email") || undefined : undefined,
        college: collegeEnabled ? get("college") || undefined : undefined,
        department: departmentEnabled ? get("department") || undefined : undefined,
        level: levelEnabled ? get("level") || undefined : undefined,
        photo_url: photoEnabled ? get("photo_url") || undefined : undefined,
      };
    });

    const issues: BulkValidationIssue[] = [];
    const seenIdentifiers = new Set<string>();
    const emailPattern = /\S+@\S+\.\S+/;
    const allowedLevels = new Set(["100", "200", "300", "400", "500", "600"]);

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      const rowIdentifier =
        row[primaryIdentifierKey as keyof StudentCSVData];

      if (!rowIdentifier) {
        issues.push({ row: rowNumber, message: `Missing ${loginIdentifier.key}` });
      } else if (seenIdentifiers.has(String(rowIdentifier))) {
        issues.push({
          row: rowNumber,
          message: `Duplicate ${loginIdentifier.key} '${rowIdentifier}' in this file`,
        });
      } else {
        seenIdentifiers.add(String(rowIdentifier));
      }

      if (!row.full_name) {
        issues.push({ row: rowNumber, message: "Missing full_name" });
      }

      if (emailRequired && !row.email) {
        issues.push({ row: rowNumber, message: "Missing email" });
      } else if (row.email && !emailPattern.test(row.email)) {
        issues.push({
          row: rowNumber,
          message: `Invalid email '${row.email}'`,
        });
      }

      if (levelEnabled && row.level && !allowedLevels.has(row.level)) {
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
    const templateColumns = [
      loginIdentifier.key,
      "full_name",
      ...(emailEnabled ? ["email"] : []),
      ...(collegeEnabled ? ["college"] : []),
      ...(departmentEnabled ? ["department"] : []),
      ...(levelEnabled ? ["level"] : []),
      ...(photoEnabled ? ["photo_url"] : []),
    ];
    const csv = [
      "# Template notes:",
      "# 1. Keep the header row unchanged.",
      `# 2. ${[
        loginIdentifier.key,
        "full_name",
        ...(emailRequired ? ["email"] : []),
        ...(collegeRequired ? ["college"] : []),
        ...(departmentRequired ? ["department"] : []),
        ...(levelRequired ? ["level"] : []),
      ].join(", ")} are required.`,
      levelEnabled
        ? "# 3. level must be one of 100, 200, 300, 400, 500, 600."
        : "# 3. This tenant does not use academic level.",
      "# 4. Structure fields may be left blank only if you will apply overrides in this dialog.",
      templateColumns.join(","),
      [
        loginIdentifier.placeholder,
        "Ada Lovelace",
        ...(emailEnabled ? ["ada.lovelace@example.edu"] : []),
        ...(collegeEnabled ? [sampleCollege?.name || "College of Science"] : []),
        ...(departmentEnabled
          ? [sampleDepartment?.name || "Computer Science"]
          : []),
        ...(levelEnabled ? ["300"] : []),
        ...(photoEnabled ? ["https://example.com/ada-lovelace.jpg"] : []),
      ].join(","),
      [
        loginIdentifier.key === "matric_no"
          ? "BU22CSC1002"
          : loginIdentifier.key === "member_id"
            ? "MEM-1002"
            : loginIdentifier.key === "employee_id"
              ? "EMP-1002"
              : "grace.hopper",
        "Grace Hopper",
        ...(emailEnabled ? ["grace.hopper@example.edu"] : []),
        ...(collegeEnabled ? [sampleCollege?.name || "College of Science"] : []),
        ...(departmentEnabled
          ? [sampleDepartment?.name || "Computer Science"]
          : []),
        ...(levelEnabled ? ["400"] : []),
        ...(photoEnabled ? [""] : []),
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

    const selectedCollege = collegeEnabled
      ? overview.colleges.find((college) => college.id === manualForm.collegeId)
      : undefined;

    const selectedDepartment =
      collegeEnabled && departmentEnabled
        ? selectedCollege?.departments.find(
            (department) => department.id === manualForm.departmentId,
          )
        : undefined;

    if (collegeRequired && !selectedCollege) {
      setLocalError("Select a valid college.");
      return;
    }

    if (departmentRequired && !selectedDepartment) {
      setLocalError("Select a valid department.");
      return;
    }

    setLocalError(null);

    const payload: StudentCSVData = {
      matric_no: manualForm.matric_no.trim().toUpperCase() || undefined,
      member_id: manualForm.member_id.trim().toUpperCase() || undefined,
      employee_id: manualForm.employee_id.trim().toUpperCase() || undefined,
      username: manualForm.username.trim().toLowerCase() || undefined,
      full_name: manualForm.full_name.trim(),
      email: emailEnabled ? manualForm.email.trim().toLowerCase() || undefined : undefined,
      college: collegeEnabled ? selectedCollege?.name : undefined,
      department: departmentEnabled ? selectedDepartment?.name : undefined,
      level: levelEnabled ? manualForm.level : undefined,
      photo_url: photoEnabled ? manualForm.photo_url.trim() || undefined : undefined,
    };

    if (!payload[primaryIdentifierKey]) {
      setLocalError(`Enter a valid ${loginIdentifier.label.toLowerCase()}.`);
      return;
    }

    if (emailRequired && !payload.email) {
      setLocalError("Email is required for this tenant configuration.");
      return;
    }

    if (levelRequired && !payload.level) {
      setLocalError("Level is required for this tenant configuration.");
      return;
    }

    await onCreateManual(payload);
  };

  const submitBulk = async () => {
    if (bulkRows.length === 0 || !overview || bulkValidationIssues.length > 0) {
      return;
    }

    const selectedCollege =
      collegeEnabled && targetCollegeId !== "all"
        ? overview.colleges.find((college) => college.id === targetCollegeId)
        : undefined;

    const selectedDepartment =
      departmentEnabled && targetDepartmentId !== "all"
        ? selectedCollege?.departments.find(
            (department) => department.id === targetDepartmentId,
          )
        : undefined;

    setLocalError(null);

    await onCreateBulk(bulkRows, {
      college: collegeEnabled ? selectedCollege?.name : undefined,
      department: departmentEnabled ? selectedDepartment?.name : undefined,
      level: levelEnabled && targetLevel !== "all" ? targetLevel : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create {participantLabels.plural}</DialogTitle>
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
                  <Label className="text-xs">{loginIdentifier.label}</Label>
                  <Input
                    value={
                      manualForm[primaryIdentifierKey] as string
                    }
                    onChange={(event) =>
                      setManualForm((prev) => ({
                        ...prev,
                        [primaryIdentifierKey]: event.target.value,
                      }))
                    }
                    placeholder={loginIdentifier.placeholder}
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

                {emailEnabled ? (
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
                    required={emailRequired}
                  />
                </div>
                ) : null}

                {collegeEnabled ? (
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
                ) : null}

                {departmentEnabled ? (
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
                ) : null}

                {levelEnabled ? (
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
                ) : null}

                {photoEnabled ? (
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
                ) : null}
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
                  {isSubmitting ? "Creating..." : `Create ${participantLabels.singular}`}
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
                {collegeEnabled ? (
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
                ) : null}

                {departmentEnabled ? (
                <Select
                  value={targetDepartmentId}
                  onValueChange={setTargetDepartmentId}
                  disabled={!collegeEnabled || targetCollegeId === "all"}
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
                ) : null}

                {levelEnabled ? (
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
                ) : null}
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
                  {isSubmitting ? "Uploading..." : `Upload ${participantLabels.plural}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
