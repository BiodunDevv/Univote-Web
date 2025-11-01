"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { PageHeader } from "@/components/College/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Trash2,
  RefreshCw,
  Download,
  Calendar,
  Activity,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AuditLogsPage() {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  const {
    auditLogs,
    auditActions,
    pagination,
    getAuditLogs,
    getAuditActions,
    cleanupAuditLogs,
    exportData,
    loading,
    error,
  } = useSettingsStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(5);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.push("/auth/signin");
    }
  }, [token, router, isHydrated]);

  useEffect(() => {
    if (isHydrated && token && isSuperAdmin) {
      fetchAuditLogs();
      getAuditActions(token);
    } else if (isHydrated && !isSuperAdmin) {
      router.push("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, token, isSuperAdmin]);

  const fetchAuditLogs = () => {
    if (!token) return;

    const params: Record<string, string> = {
      page: currentPage.toString(),
      limit: limit.toString(),
    };

    if (selectedAction) params.action = selectedAction;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    getAuditLogs(token, params);
  };

  useEffect(() => {
    if (isHydrated && token && isSuperAdmin) {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedAction, startDate, endDate]);

  const handleClearFilters = () => {
    setSelectedAction("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleCleanup = async () => {
    if (!token) return;

    try {
      await cleanupAuditLogs(token, cleanupDays);
      setShowCleanupDialog(false);
      fetchAuditLogs();
    } catch {
      // Error handled by store
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    if (!token) return;

    setIsExporting(true);
    try {
      const filters: Record<string, string> = {};
      if (selectedAction) filters.action = selectedAction;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const blob = await exportData(token, "audit_logs", format, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Error handled by store
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isHydrated || !token || !admin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Audit Logs"
        subtitle="Track all administrative activities and system changes"
        onBack={() => router.push("/dashboard")}
        badges={
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="h-8 sm:h-9"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""} sm:mr-2`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters Card */}
        <Card className="border shadow-none">
          <CardHeader className="border-b py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold">Filters</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Action Filter */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Action
                </Label>
                <Select
                  value={selectedAction || "all"}
                  onValueChange={(value) =>
                    setSelectedAction(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {auditActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* End Date */}
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  End Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="border shadow-none">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-sm font-semibold">Actions</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("json")}
                  disabled={isExporting || loading}
                  className="h-9 w-full sm:w-auto"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  <span className="hidden sm:inline">Export JSON</span>
                  <span className="sm:hidden">JSON</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                  disabled={isExporting || loading}
                  className="h-9 w-full sm:w-auto"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCleanupDialog(true)}
                  className="h-9 w-full sm:w-auto"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  <span className="hidden lg:inline">Cleanup Old Logs</span>
                  <span className="lg:hidden">Cleanup</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Logs Table */}
        <Card className="border shadow-none">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Audit Log Entries
                </CardTitle>
                {pagination && (
                  <CardDescription className="text-xs mt-1">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} entries
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs w-[180px]">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-xs w-[200px]">Action</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                    <TableHead className="text-xs w-[200px]">Admin</TableHead>
                    <TableHead className="text-xs w-[120px]">
                      IP Address
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && auditLogs.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="h-8 w-8" />
                          <p className="text-sm">No audit logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-md">
                          <p
                            className="truncate"
                            title={
                              typeof log.details === "string"
                                ? log.details
                                : JSON.stringify(log.details)
                            }
                          >
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details)}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.admin ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                {log.admin.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {log.admin.name}
                                </p>
                                <p className="text-muted-foreground truncate">
                                  {log.admin.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              System
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip_address || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.pages || loading}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cleanup Dialog */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cleanup Old Audit Logs</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete audit logs older than the specified
              number of days. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cleanupDays" className="text-sm mb-2 block">
              Delete logs older than (days):
            </Label>
            <Input
              id="cleanupDays"
              type="number"
              min={1}
              value={cleanupDays}
              onChange={(e) => {
                const value = e.target.value;
                setCleanupDays(value === "" ? 1 : parseInt(value) || 1);
              }}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground mt-2">Minimum: 1 day</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              disabled={loading || cleanupDays < 1}
              className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Cleaning...
                </>
              ) : (
                "Delete Logs"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
