"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  FileImage,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import type { StudentCSVData } from "@/types/student";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
  isTenantParticipantFieldRequired,
} from "@/lib/tenant-config";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const { tenant } = useAuthStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [bulkRows, setBulkRows] = useState<StudentCSVData[]>([]);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [isDraggingManualImage, setIsDraggingManualImage] = useState(false);
  const [isDraggingBulkImages, setIsDraggingBulkImages] = useState(false);
  const [isManualImageUploading, setIsManualImageUploading] = useState(false);
  const [isBulkImageUploading, setIsBulkImageUploading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const manualImageInputRef = useRef<HTMLInputElement | null>(null);
  const bulkImageInputRef = useRef<HTMLInputElement | null>(null);
  const [targetCollegeId, setTargetCollegeId] = useState("all");
  const [targetDepartmentId, setTargetDepartmentId] = useState("all");
  const [targetLevel, setTargetLevel] = useState("all");
  const [localError, setLocalError] = useState<string | null>(null);
  const [bulkValidationIssues, setBulkValidationIssues] = useState<
    BulkValidationIssue[]
  >([]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const collegeRequired = isTenantParticipantFieldRequired(tenant, "college");
  const departmentEnabled = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );
  const departmentRequired = isTenantParticipantFieldRequired(
    tenant,
    "department",
  );
  const levelEnabled = isTenantParticipantFieldEnabled(tenant, "level");
  const levelRequired = isTenantParticipantFieldRequired(tenant, "level");
  const photoEnabled = isTenantParticipantFieldEnabled(tenant, "photo_url");

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

  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result;
  };

  const escapeCsvValue = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
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
      throw new Error(
        "Use comma-separated CSV files. Semicolon-delimited files are not supported.",
      );
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
      header.trim().toLowerCase(),
    );
    const required = ["matric_no", "full_name", "email"];
    if (collegeRequired) required.push("college");
    if (departmentRequired) required.push("department");
    if (levelRequired) required.push("level");
    const missing = required.filter((key) => !headers.includes(key));

    if (missing.length > 0) {
      throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
    }

    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line).map((value) => value.trim());
      const get = (key: string) => values[headers.indexOf(key)] || "";

      return {
        matric_no: get("matric_no").toUpperCase() || undefined,
        full_name: get("full_name"),
        email: get("email") || undefined,
        college: collegeEnabled ? get("college") || undefined : undefined,
        department: departmentEnabled
          ? get("department") || undefined
          : undefined,
        level: levelEnabled ? get("level") || undefined : undefined,
        photo_url: photoEnabled ? get("photo_url") || undefined : undefined,
      };
    });

    const issues: BulkValidationIssue[] = [];
    const seenMatricNos = new Set<string>();
    const seenEmails = new Set<string>();
    const emailPattern = /\S+@\S+\.\S+/;
    const allowedLevels = new Set(["100", "200", "300", "400", "500", "600"]);

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      const rowMatric = row.matric_no;
      const rowEmail = row.email?.trim().toLowerCase() || "";

      if (!rowMatric) {
        issues.push({ row: rowNumber, message: "Missing matric_no" });
      } else if (seenMatricNos.has(rowMatric)) {
        issues.push({
          row: rowNumber,
          message: `Duplicate matric_no '${rowMatric}' in this file`,
        });
      } else {
        seenMatricNos.add(rowMatric);
      }

      if (!row.full_name) {
        issues.push({ row: rowNumber, message: "Missing full_name" });
      }

      if (!rowEmail) {
        issues.push({ row: rowNumber, message: "Missing email" });
      } else if (!emailPattern.test(rowEmail)) {
        issues.push({
          row: rowNumber,
          message: `Invalid email '${row.email}'`,
        });
      } else if (seenEmails.has(rowEmail)) {
        issues.push({
          row: rowNumber,
          message: `Duplicate email '${row.email}' in this file`,
        });
      } else {
        seenEmails.add(rowEmail);
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

  const validateBulkRows = (rows: StudentCSVData[]): BulkValidationIssue[] => {
    const issues: BulkValidationIssue[] = [];
    const seenMatricNos = new Set<string>();
    const seenEmails = new Set<string>();
    const emailPattern = /\S+@\S+\.\S+/;
    const allowedLevels = new Set(["100", "200", "300", "400", "500", "600"]);

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowMatric = row.matric_no;
      const rowEmail = row.email?.trim().toLowerCase() || "";

      if (!rowMatric) {
        issues.push({ row: rowNumber, message: "Missing matric_no" });
      } else if (seenMatricNos.has(rowMatric)) {
        issues.push({
          row: rowNumber,
          message: `Duplicate matric_no '${rowMatric}' in this file`,
        });
      } else {
        seenMatricNos.add(rowMatric);
      }

      if (!row.full_name) {
        issues.push({ row: rowNumber, message: "Missing full_name" });
      }

      if (!rowEmail) {
        issues.push({ row: rowNumber, message: "Missing email" });
      } else if (!emailPattern.test(rowEmail)) {
        issues.push({
          row: rowNumber,
          message: `Invalid email '${row.email}'`,
        });
      } else if (seenEmails.has(rowEmail)) {
        issues.push({
          row: rowNumber,
          message: `Duplicate email '${row.email}' in this file`,
        });
      } else {
        seenEmails.add(rowEmail);
      }

      if (levelEnabled && row.level && !allowedLevels.has(row.level)) {
        issues.push({
          row: rowNumber,
          message: `Invalid level '${row.level}'. Use 100, 200, 300, 400, 500, or 600.`,
        });
      }
    });

    return issues;
  };

  const downloadTemplate = () => {
    const sampleCollege = overview?.colleges[0];
    const sampleDepartment = sampleCollege?.departments[0];
    const templateColumns = [
      "matric_no",
      "full_name",
      "email",
      ...(collegeEnabled ? ["college"] : []),
      ...(departmentEnabled ? ["department"] : []),
      ...(levelEnabled ? ["level"] : []),
      ...(photoEnabled ? ["photo_url"] : []),
    ];
    const csv = [
      "# Template notes:",
      "# 1. Keep the header row unchanged.",
      `# 2. ${[
        "matric_no",
        "full_name",
        "email",
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
        "BU22CSC1001",
        "Ada Lovelace",
        "ada.lovelace@example.edu",
        ...(collegeEnabled
          ? [sampleCollege?.name || "College of Science"]
          : []),
        ...(departmentEnabled
          ? [sampleDepartment?.name || "Computer Science"]
          : []),
        ...(levelEnabled ? ["300"] : []),
        ...(photoEnabled ? ["https://example.com/ada-lovelace.jpg"] : []),
      ]
        .map((value) => escapeCsvValue(value))
        .join(","),
      [
        "BU22CSC1002",
        "Grace Hopper",
        "grace.hopper@example.edu",
        ...(collegeEnabled
          ? [sampleCollege?.name || "College of Science"]
          : []),
        ...(departmentEnabled
          ? [sampleDepartment?.name || "Computer Science"]
          : []),
        ...(levelEnabled ? ["400"] : []),
        ...(photoEnabled ? [""] : []),
      ]
        .map((value) => escapeCsvValue(value))
        .join(","),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "univote-student-upload-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const processCsvFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setBulkRows([]);
      setBulkValidationIssues([]);
      setLocalError("Please upload a valid CSV file.");
      return;
    }

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

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processCsvFile(file);
  };

  const handleCsvDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingCsv(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    processCsvFile(file);
  };

  const removeBulkRow = (indexToRemove: number) => {
    setBulkRows((prev) => {
      const updatedRows = prev.filter((_, index) => index !== indexToRemove);
      const updatedIssues = validateBulkRows(updatedRows);
      setBulkValidationIssues(updatedIssues);
      setLocalError(
        updatedIssues.length > 0
          ? `Found ${updatedIssues.length} validation issue(s). Fix the file and upload again.`
          : null,
      );
      return updatedRows;
    });
  };

  const clearBulkRows = () => {
    setBulkRows([]);
    setBulkValidationIssues([]);
    setLocalError(null);
  };

  const handleManualImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLocalError("Please upload a valid image file.");
      return;
    }

    try {
      setIsManualImageUploading(true);
      setLocalError(null);
      const url = await uploadImageToCloudinary(file, "univote/students");
      setManualForm((prev) => ({ ...prev, photo_url: url }));
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setIsManualImageUploading(false);
    }
  };

  const handleBulkImageFiles = async (files: FileList | File[]) => {
    if (bulkRows.length === 0) {
      setLocalError("Upload CSV rows before adding images.");
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) {
      setLocalError("No valid image files found.");
      return;
    }

    try {
      setIsBulkImageUploading(true);
      setLocalError(null);
      const uploaded = await Promise.all(
        imageFiles.map(async (file) => {
          const baseName = file.name
            .replace(/\.[^.]+$/, "")
            .trim()
            .toLowerCase();
          const url = await uploadImageToCloudinary(file, "univote/students");
          return { baseName, url };
        }),
      );

      const urlByName = new Map(
        uploaded.map((item) => [item.baseName, item.url]),
      );
      let matched = 0;

      setBulkRows((rows) =>
        rows.map((row) => {
          const keys = [
            String(row.matric_no || "").toLowerCase(),
            String(row.email || "")
              .toLowerCase()
              .split("@")[0],
          ].filter(Boolean);

          const matchedUrl = keys
            .map((key) => urlByName.get(key))
            .find(Boolean);
          if (matchedUrl) matched += 1;

          return matchedUrl ? { ...row, photo_url: matchedUrl } : row;
        }),
      );

      if (matched === 0) {
        setLocalError(
          "Images uploaded, but no filename matched CSV identifiers. Use filenames like BU22CSC1001.jpg.",
        );
      }
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Failed to upload bulk images.",
      );
    } finally {
      setIsBulkImageUploading(false);
    }
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
      full_name: manualForm.full_name.trim(),
      email: manualForm.email.trim().toLowerCase() || undefined,
      college: collegeEnabled ? selectedCollege?.name : undefined,
      department: departmentEnabled ? selectedDepartment?.name : undefined,
      level: levelEnabled ? manualForm.level : undefined,
      photo_url: photoEnabled
        ? manualForm.photo_url.trim() || undefined
        : undefined,
    };

    if (!payload.matric_no) {
      setLocalError("Enter a valid matric number.");
      return;
    }

    if (!payload.email) {
      setLocalError("Email is required.");
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
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="h-full w-full max-w-full overflow-y-auto border-l sm:max-w-5xl"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Create {participantLabels.plural}</SheetTitle>
          <SheetDescription>
            Add one record manually or upload many at once with CSV.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-5 py-4">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as Mode);
              setLocalError(null);
            }}
          >
            <TabsList className="grid h-9 w-full grid-cols-2 md:w-[320px]">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>
          </Tabs>

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
                        matric_no: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="BU22CSC1001"
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

                <div className="space-y-1.5">
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
                        {(activeCollege?.departments || []).map(
                          (department) => (
                            <SelectItem
                              key={department.id}
                              value={department.id}
                            >
                              {department.name}
                            </SelectItem>
                          ),
                        )}
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
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">Photo</Label>
                    <div
                      className={`rounded-xl border-2 border-dashed p-5 transition-colors ${
                        isDraggingManualImage
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingManualImage(true);
                      }}
                      onDragLeave={() => setIsDraggingManualImage(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDraggingManualImage(false);
                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;
                        void handleManualImageFile(file);
                      }}
                    >
                      <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => manualImageInputRef.current?.click()}
                          disabled={isManualImageUploading}
                        >
                          {isManualImageUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FileImage className="mr-2 h-4 w-4" />
                              Upload image
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Drag and drop an image here, or click to select.
                        </p>
                      </div>
                      <input
                        ref={manualImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void handleManualImageFile(file);
                        }}
                      />
                    </div>
                    {manualForm.photo_url ? (
                      <div className="overflow-hidden rounded-xl border bg-muted/20">
                        <img
                          src={manualForm.photo_url}
                          alt="Student upload preview"
                          className="h-56 w-full object-cover"
                        />
                      </div>
                    ) : null}
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

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={Boolean(isSubmitting)}>
                  {isSubmitting
                    ? "Creating..."
                    : `Create ${participantLabels.singular}`}
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
                <div
                  className={`rounded-lg border border-dashed p-4 transition-colors ${
                    isDraggingCsv
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingCsv(true);
                  }}
                  onDragLeave={() => setIsDraggingCsv(false)}
                  onDrop={handleCsvDrop}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => csvInputRef.current?.click()}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Select CSV
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Drag and drop CSV here or click Select CSV.
                    </p>
                  </div>
                  <Input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {photoEnabled ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs">Bulk Images (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => bulkImageInputRef.current?.click()}
                      disabled={isBulkImageUploading}
                    >
                      {isBulkImageUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileImage className="mr-2 h-4 w-4" />
                          Upload images
                        </>
                      )}
                    </Button>
                  </div>
                  <div
                    className={`rounded-lg border border-dashed p-4 transition-colors ${
                      isDraggingBulkImages
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingBulkImages(true);
                    }}
                    onDragLeave={() => setIsDraggingBulkImages(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDraggingBulkImages(false);
                      void handleBulkImageFiles(event.dataTransfer.files);
                    }}
                  >
                    <p className="text-xs text-muted-foreground">
                      Drop image files named by identifier (for example
                      BU22CSC1001.jpg). Matching rows will receive uploaded
                      photo URLs automatically.
                    </p>
                    <Input
                      ref={bulkImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const files = event.target.files;
                        if (!files) return;
                        void handleBulkImageFiles(files);
                      }}
                    />
                  </div>
                </div>
              ) : null}

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

              {bulkRows.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">
                      CSV Preview
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearBulkRows}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear all
                    </Button>
                  </div>

                  <div className="max-h-[360px] overflow-auto rounded-lg border">
                    <Table className="min-w-[980px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Matric No</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          {collegeEnabled ? (
                            <TableHead>College</TableHead>
                          ) : null}
                          {departmentEnabled ? (
                            <TableHead>Department</TableHead>
                          ) : null}
                          {levelEnabled ? <TableHead>Level</TableHead> : null}
                          {photoEnabled ? (
                            <TableHead>Photo URL</TableHead>
                          ) : null}
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkRows.map((row, index) => (
                          <TableRow
                            key={`${row.matric_no || row.email || "row"}-${index}`}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono">
                              {row.matric_no || "-"}
                            </TableCell>
                            <TableCell>{row.full_name || "-"}</TableCell>
                            <TableCell>{row.email || "-"}</TableCell>
                            {collegeEnabled ? (
                              <TableCell>{row.college || "-"}</TableCell>
                            ) : null}
                            {departmentEnabled ? (
                              <TableCell>{row.department || "-"}</TableCell>
                            ) : null}
                            {levelEnabled ? (
                              <TableCell>{row.level || "-"}</TableCell>
                            ) : null}
                            {photoEnabled ? (
                              <TableCell className="max-w-[220px] truncate">
                                {row.photo_url || "-"}
                              </TableCell>
                            ) : null}
                            <TableCell>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeBulkRow(index)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}

              {bulkValidationIssues.length > 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">
                    Validation issues
                  </p>
                  <div className="mt-2 space-y-1">
                    {bulkValidationIssues.slice(0, 8).map((issue, index) => (
                      <p
                        key={`${issue.row}-${index}`}
                        className="text-xs text-destructive"
                      >
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

              <div className="flex justify-end gap-2 border-t pt-3">
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
                  {isSubmitting
                    ? "Uploading..."
                    : `Upload ${participantLabels.plural}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
