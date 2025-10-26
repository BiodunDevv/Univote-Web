"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Upload,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useStudentStore } from "@/lib/store/useStudentStore";

interface CSVStudent {
  matric_no: string;
  full_name: string;
  email: string;
  department?: string;
  college?: string;
  level?: string;
}

interface UploadResult {
  message: string;
  results: {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{
      matric_no: string;
      full_name: string;
      error: string;
    }>;
    target: {
      college: string;
      department: string;
      level: string;
    };
  };
}

export default function UploadStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const { token, admin } = useAuthStore();
  const { currentCollege } = useCollegeStore();
  const { uploadStudents, loading } = useStudentStore();

  const [csvData, setCSVData] = useState<CSVStudent[]>([]);
  const [targetDepartment, setTargetDepartment] = useState<string>("");
  const [targetLevel, setTargetLevel] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = admin?.role === "super_admin";

  // Handle authorization redirect in useEffect to avoid state update during render
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push(`/dashboard/colleges/${collegeId}`);
    }
  }, [isSuperAdmin, router, collegeId]);

  // Don't render if not authorized
  if (!isSuperAdmin) {
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setError(
            "CSV file must contain a header row and at least one data row"
          );
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        // Validate required headers
        const requiredHeaders = ["matric_no", "full_name", "email"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          setError(
            `Missing required columns: ${missingHeaders.join(
              ", "
            )}. Required: matric_no, full_name, email`
          );
          return;
        }

        const students: CSVStudent[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.length < 3) continue;

          const student: CSVStudent = {
            matric_no: formatMatricNo(
              values[headers.indexOf("matric_no")] || ""
            ),
            full_name: values[headers.indexOf("full_name")] || "",
            email: values[headers.indexOf("email")] || "",
          };

          // Optional fields
          if (headers.includes("department")) {
            student.department = values[headers.indexOf("department")] || "";
          }
          if (headers.includes("college")) {
            student.college = values[headers.indexOf("college")] || "";
          }
          if (headers.includes("level")) {
            student.level = values[headers.indexOf("level")] || "";
          }

          students.push(student);
        }

        setCSVData(students);
        setError(null);
        setUploadResult(null);
      } catch {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };

    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!token || csvData.length === 0) return;

    setError(null);
    setUploadResult(null);

    // Pre-upload validation
    const missingFields = csvData.filter(
      (student) =>
        !student.matric_no ||
        !student.full_name ||
        !student.email ||
        student.matric_no.trim() === "" ||
        student.full_name.trim() === "" ||
        student.email.trim() === ""
    );

    if (missingFields.length > 0) {
      setError(
        `${missingFields.length} student${
          missingFields.length > 1 ? "s" : ""
        } missing required fields (matric number, full name, or email). Please check your CSV file.`
      );
      return;
    }

    // Validate matric number format
    const matricRegex = /^[A-Z]{2}\d{2}[A-Z]{3}\d{4}$/;
    const invalidMatric = csvData.filter(
      (student) => !matricRegex.test(student.matric_no)
    );

    if (invalidMatric.length > 0) {
      setError(
        `${invalidMatric.length} student${
          invalidMatric.length > 1 ? "s have" : " has"
        } invalid matric number format. Expected format: BU22CSC1005 (2 letters, 2 digits, 3 letters, 4 digits)`
      );
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = csvData.filter(
      (student) => !emailRegex.test(student.email)
    );

    if (invalidEmails.length > 0) {
      setError(
        `${invalidEmails.length} student${
          invalidEmails.length > 1 ? "s have" : " has"
        } invalid email addresses. Please check the email format.`
      );
      return;
    }

    // Check for duplicate matric numbers
    const matricNumbers = csvData.map((s) => s.matric_no);
    const duplicates = matricNumbers.filter(
      (item, index) => matricNumbers.indexOf(item) !== index
    );

    if (duplicates.length > 0) {
      setError(
        `Duplicate matric numbers found in CSV: ${[...new Set(duplicates)].join(
          ", "
        )}. Each student must have a unique matric number.`
      );
      return;
    }

    // Validate department is provided (either in CSV or dropdown)
    const missingDept = csvData.filter(
      (student) => !student.department && !targetDepartment
    );

    if (missingDept.length > 0) {
      setError(
        `${missingDept.length} student${
          missingDept.length > 1 ? "s" : ""
        } missing department. Please either include department in CSV or select an override department.`
      );
      return;
    }

    // Validate level is provided (either in CSV or dropdown)
    const missingLevel = csvData.filter(
      (student) => !student.level && !targetLevel
    );

    if (missingLevel.length > 0) {
      setError(
        `${missingLevel.length} student${
          missingLevel.length > 1 ? "s" : ""
        } missing level. Please either include level in CSV or select an override level.`
      );
      return;
    }

    try {
      const result = await uploadStudents(token, csvData, {
        college: currentCollege?.name,
        department: targetDepartment || undefined,
        level: targetLevel || undefined,
      });

      setUploadResult(result);
    } catch (err) {
      let errorMessage = "Failed to upload students";

      if (err instanceof Error) {
        // Parse common backend errors and provide user-friendly messages
        const message = err.message;

        if (message.includes("Invalid CSV data format")) {
          errorMessage =
            "Invalid CSV format. Please check your file and try again.";
        } else if (
          message.includes("College") &&
          message.includes("not found")
        ) {
          errorMessage =
            "The specified college was not found. Please check your college selection.";
        } else if (
          message.includes("Department") &&
          message.includes("does not exist")
        ) {
          errorMessage =
            "The specified department does not exist in this college. Please check your department selection.";
        } else if (message.includes("Missing required fields")) {
          errorMessage =
            "Some students are missing required information. Please ensure all rows have matric number, full name, email, department, college, and level.";
        } else if (message.includes("Invalid level")) {
          errorMessage =
            "Invalid level specified. Valid levels are: 100, 200, 300, 400, 500, 600.";
        } else if (message.includes("not offered")) {
          errorMessage =
            "Some students have levels that are not offered by their department. Check the upload results for details.";
        } else if (message.includes("network") || message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (
          message.includes("Unauthorized") ||
          message.includes("401")
        ) {
          errorMessage =
            "Your session has expired. Please refresh the page and log in again.";
        } else {
          errorMessage =
            message || "An unexpected error occurred. Please try again.";
        }
      }

      setError(errorMessage);
    }
  };

  const downloadTemplate = () => {
    const template =
      "matric_no,full_name,email\nBU22CSC1005,John Doe,john.doe@example.com\nBU22CSC1006,Jane Smith,jane.smith@example.com";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatMatricNo = (matric: string) => {
    // If matric is already in proper format (e.g., BU22CSC1005), return as is
    if (/^[A-Z]{2}\d{2}[A-Z]{3}\d{4}$/.test(matric.toUpperCase())) {
      return matric.toUpperCase();
    }

    // Otherwise, return as entered
    return matric.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  router.push(`/dashboard/colleges/${collegeId}/students`)
                }
                className="rounded-full hover:bg-accent h-9 w-9"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Upload Students
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentCollege?.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="h-9 rounded-full"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Template
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-3">
        {/* Instructions */}
        <Card className="p-4 border shadow-none">
          <h3 className="font-semibold text-foreground mb-2 text-sm">
            Upload Instructions
          </h3>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>
              1. Download the CSV template and fill in the student information
            </p>
            <p>
              2. <strong>Required CSV columns:</strong> matric_no, full_name,
              email
            </p>
            <p>
              3. <strong className="text-primary">Department and Level:</strong>{" "}
              Set using the &quot;Override Department&quot; and &quot;Override
              Level&quot; fields below
            </p>
            <p>
              4.{" "}
              <strong className="text-orange-600">
                Override values apply to ALL students in the CSV
              </strong>
            </p>
            <p>5. Upload the completed CSV file</p>
          </div>
        </Card>

        {/* Target Settings */}
        <Card className="p-4 border shadow-none">
          <h3 className="font-semibold text-foreground mb-2 text-sm">
            Override Department & Level
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            <strong className="text-orange-600">
              These values will override
            </strong>{" "}
            any department/level specified in the CSV. Leave empty to use CSV
            values.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Override Department
              </label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">None (use CSV values)</option>
                {currentCollege?.departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Override Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">None (use CSV values)</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
              </select>
            </div>
          </div>
        </Card>

        {/* File Upload */}
        <Card className="p-4 border shadow-none">
          <label className="block">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Click to upload CSV file
              </p>
              <p className="text-xs text-muted-foreground">
                or drag and drop your CSV file here
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </label>

          {csvData.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {csvData.length} students ready to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CSV file parsed successfully
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCSVData([])}
                    className="h-8 w-8 rounded-full hover:bg-accent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Matric No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Full Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Department
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvData.map((student, index) => {
                        // Use target defaults if set (override CSV), otherwise use CSV values
                        const effectiveDept =
                          targetDepartment || student.department;
                        const effectiveLevel = targetLevel || student.level;

                        return (
                          <tr
                            key={`${index}-${targetDepartment}-${targetLevel}`}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-3 py-2 font-mono font-semibold text-primary text-xs">
                              {student.matric_no}
                            </td>
                            <td className="px-3 py-2 text-foreground text-sm">
                              {student.full_name}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">
                              {student.email}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {effectiveDept ? (
                                <span className="text-foreground">
                                  {effectiveDept}
                                  {targetDepartment &&
                                    student.department &&
                                    targetDepartment !== student.department && (
                                      <span className="text-xs ml-1 text-orange-600">
                                        (overridden)
                                      </span>
                                    )}
                                  {targetDepartment && !student.department && (
                                    <span className="text-xs ml-1 text-muted-foreground">
                                      (default)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-destructive italic">
                                  Not set
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {effectiveLevel ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                  {effectiveLevel}
                                  {targetLevel &&
                                    student.level &&
                                    targetLevel !== student.level && (
                                      <span className="ml-1 text-orange-600">
                                        (overridden)
                                      </span>
                                    )}
                                  {targetLevel && !student.level && (
                                    <span className="ml-1">(default)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-destructive italic">
                                  Not set
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-6 border-destructive/50 bg-destructive/5 shadow-none">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-destructive mb-2">
                  Upload Failed
                </h3>
                <p className="text-sm text-destructive/90 mb-3">{error}</p>
                <div className="text-xs text-destructive/70 space-y-1 bg-background/50 p-3 rounded border border-destructive/20">
                  <p className="font-medium text-foreground mb-2">
                    💡 Suggestions:
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    {error.includes("format") && (
                      <>
                        <li>
                          Download the template and use the correct format
                        </li>
                        <li>
                          Matric numbers must follow: BU22CSC1005 (2 letters, 2
                          digits, 3 letters, 4 digits)
                        </li>
                      </>
                    )}
                    {error.includes("missing") && (
                      <>
                        <li>
                          Check that all rows have matric_no, full_name, and
                          email
                        </li>
                        <li>
                          Make sure there are no empty cells in required columns
                        </li>
                      </>
                    )}
                    {error.includes("department") && (
                      <>
                        <li>
                          Verify department names match exactly (case-sensitive)
                        </li>
                        <li>
                          Or use the &quot;Override Department&quot; dropdown to
                          set a default
                        </li>
                      </>
                    )}
                    {error.includes("level") && (
                      <>
                        <li>Valid levels are: 100, 200, 300, 400, 500, 600</li>
                        <li>
                          Or use the &quot;Override Level&quot; dropdown to set
                          a default
                        </li>
                      </>
                    )}
                    {error.includes("email") && (
                      <>
                        <li>Check email format (must include @ and domain)</li>
                        <li>Remove any spaces or special characters</li>
                      </>
                    )}
                    {error.includes("duplicate") && (
                      <>
                        <li>Check for duplicate matric numbers in your CSV</li>
                        <li>Each student must have a unique matric number</li>
                      </>
                    )}
                    {error.includes("network") && (
                      <>
                        <li>Check your internet connection</li>
                        <li>Try refreshing the page and uploading again</li>
                      </>
                    )}
                    {error.includes("session") && (
                      <>
                        <li>Your session has expired</li>
                        <li>Please refresh the page and log in again</li>
                      </>
                    )}
                    {!error.includes("format") &&
                      !error.includes("missing") &&
                      !error.includes("department") &&
                      !error.includes("level") &&
                      !error.includes("email") &&
                      !error.includes("duplicate") &&
                      !error.includes("network") &&
                      !error.includes("session") && (
                        <>
                          <li>Try downloading and checking your CSV file</li>
                          <li>If the issue persists, contact support</li>
                        </>
                      )}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Card className="p-6 border shadow-none">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {uploadResult.results.failed === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">
                    {uploadResult.results.failed === 0
                      ? "Upload Successful!"
                      : "Upload Completed with Errors"}
                  </h3>
                  {uploadResult.results.failed === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      All students were processed successfully. Redirecting...
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {uploadResult.results.created +
                        uploadResult.results.updated}{" "}
                      students uploaded successfully,{" "}
                      {uploadResult.results.failed} failed
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-semibold text-foreground">
                    {uploadResult.results.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-semibold text-green-600">
                    {uploadResult.results.created}
                  </p>
                  <p className="text-xs text-green-700">Created</p>
                </div>

                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-semibold text-destructive">
                    {uploadResult.results.failed}
                  </p>
                  <p className="text-xs text-destructive/80">Failed</p>
                </div>
              </div>

              {uploadResult.results.errors &&
                uploadResult.results.errors.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">
                        Failed Students ({uploadResult.results.errors.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fix these issues and re-upload
                      </p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                      {uploadResult.results.errors.map(
                        (
                          err: {
                            matric_no: string;
                            full_name: string;
                            error: string;
                          },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-foreground text-sm">
                                {err.matric_no}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {err.full_name}
                              </p>
                            </div>
                            <p className="text-xs text-destructive bg-background/50 p-2 rounded border border-destructive/10">
                              {err.error}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">
                        💡 What to do next:
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Review the errors above for each failed student</li>
                        <li>Correct the issues in your CSV file</li>
                        <li>
                          Re-upload only the failed students or all students
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
            </div>
          </Card>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={csvData.length === 0 || loading}
            className="flex-1 h-10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {csvData.length} Students
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              router.push(`/dashboard/colleges/${collegeId}/students`)
            }
            className="h-10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
