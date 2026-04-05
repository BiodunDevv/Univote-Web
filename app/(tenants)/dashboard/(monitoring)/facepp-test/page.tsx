"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ScanFace,
  Upload,
  XCircle,
} from "lucide-react";
import { isApiError } from "@/lib/api/client";
import {
  type AdminBiometricTestResponse,
  useAdminSystemConfigQuery,
  useTestBiometricMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

type BiometricErrorState = {
  error: string;
  details?: string;
  configuration?: {
    configured: boolean;
    status: string;
  };
};

export default function FaceppTestPage() {
  const { membership } = useAuthStore();
  const canRunDiagnostics = hasAnyTenantPermission(membership, [
    "tenant.manage",
    "tenant.settings.manage",
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const systemConfigQuery = useAdminSystemConfigQuery();
  const testBiometric = useTestBiometricMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<BiometricErrorState | null>(null);

  const config = systemConfigQuery.data?.system_config;
  const previewSource = previewUrl || uploadedImageUrl || manualImageUrl.trim();
  const effectiveImageUrl = uploadedImageUrl || manualImageUrl.trim();
  const testResult = testBiometric.data as
    | AdminBiometricTestResponse
    | undefined;

  const latestStatus = useMemo(() => {
    if (testResult?.test_result.success) return "Face detected";
    if (diagnosticError) return "Test failed";
    return config?.biometrics.configured ? "Ready" : "Pending";
  }, [config?.biometrics.configured, diagnosticError, testResult]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be 5MB or less.");
      return;
    }

    setSelectedFile(file);
    setManualImageUrl("");
    setUploadedImageUrl("");
    setUploadError("");
    setDiagnosticError(null);
    testBiometric.reset();

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadToCloudinary = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary upload is not configured for this environment.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "tenant-biometric-diagnostics");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message || "Failed to upload image.");
      }

      const payload = (await response.json()) as { secure_url: string };
      setUploadedImageUrl(payload.secure_url);
      setDiagnosticError(null);
      testBiometric.reset();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunTest = async () => {
    if (!effectiveImageUrl) {
      setUploadError("Upload an image or paste a public image URL first.");
      return;
    }

    setUploadError("");
    setDiagnosticError(null);

    try {
      await testBiometric.mutateAsync(effectiveImageUrl);
    } catch (error) {
      if (isApiError(error)) {
        setDiagnosticError({
          error: error.message,
          details:
            typeof error.payload?.details === "string"
              ? error.payload.details
              : undefined,
          configuration:
            typeof error.payload?.configuration === "object" &&
            error.payload.configuration !== null
              ? (error.payload.configuration as BiometricErrorState["configuration"])
              : undefined,
        });
        return;
      }

      setDiagnosticError({
        error: error instanceof Error ? error.message : "Biometric test failed.",
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setManualImageUrl("");
    setUploadedImageUrl("");
    setUploadError("");
    setDiagnosticError(null);
    testBiometric.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (systemConfigQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading AWS biometric configuration...",
          "Checking AWS biometric readiness...",
          "Preparing diagnostic workspace...",
        ]}
      />
    );
  }

  if (!canRunDiagnostics) {
    return (
      <TenantAccessRestricted
        title="Biometric diagnostics restricted"
        subtitle="Your university role does not allow tenant biometric diagnostics."
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant diagnostics"
        icon={<ScanFace className="h-5 w-5" />}
        title="AWS Biometric Test Workbench"
        subtitle="Validate tenant-ready face detection with a sample image, confirm AWS biometric readiness, and inspect the last detection response without leaving the monitoring suite."
        actions={
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset workbench
          </Button>
        }
        stats={[
          {
            label: "Provider status",
            value: config?.biometrics.configured ? "Configured" : "Pending",
          },
          {
            label: "Image source",
            value: effectiveImageUrl ? "Ready" : "Missing",
          },
          {
            label: "Latest test",
            value: latestStatus,
          },
          {
            label: "Region",
            value: config?.biometrics.region || "Unavailable",
          },
        ]}
      />

      {systemConfigQuery.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{systemConfigQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <TenantSectionCard
          title="Select an image source"
          description="Upload a local test image to Cloudinary or paste a public image URL for a direct provider check."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="biometric-file">Upload test image</Label>
              <Input
                id="biometric-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or GIF up to 5MB. Uploaded files are stored only for this diagnostic
                path.
              </p>
            </div>

            {selectedFile && !uploadedImageUrl ? (
              <Button
                variant="outline"
                onClick={handleUploadToCloudinary}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload to Cloudinary"}
              </Button>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="manual-image-url">Or paste a public image URL</Label>
              <Input
                id="manual-image-url"
                placeholder="https://example.com/sample-face.jpg"
                value={manualImageUrl}
                onChange={(event) => {
                  setManualImageUrl(event.target.value);
                  setSelectedFile(null);
                  setPreviewUrl("");
                  setUploadedImageUrl("");
                  setUploadError("");
                  setDiagnosticError(null);
                  testBiometric.reset();
                }}
              />
            </div>

            {uploadError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            ) : null}

            {previewSource ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSource}
                    alt="Biometric diagnostic preview"
                    className="h-72 w-full object-contain"
                  />
                </div>
                {uploadedImageUrl ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                    Uploaded diagnostic URL: {uploadedImageUrl}
                  </div>
                ) : null}
              </div>
            ) : (
              <TenantEmptyState
                icon={ImageIcon}
                title="No diagnostic image selected"
                description="Choose a file or paste a public image URL to start the AWS biometric validation flow."
              />
            )}
          </div>
        </TenantSectionCard>

        <TenantSectionCard
          title="Run detection and inspect the provider response"
          description="Use the active image source to validate configuration and confirm whether the provider returns a face token."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={config?.biometrics.configured ? "default" : "secondary"}>
                  {config?.biometrics.configured ? "Configured" : "Not configured"}
                </Badge>
                <Badge variant="outline">
                  Region: {config?.biometrics.region || "Unavailable"}
                </Badge>
              </div>
              <p className="mt-3 text-muted-foreground">
                Provider secrets remain server-side. This test only confirms whether the active
                tenant workspace can call the configured AWS biometric detection endpoint.
              </p>
            </div>

            <Button
              onClick={handleRunTest}
              disabled={!effectiveImageUrl || testBiometric.isPending}
            >
              <ScanFace className="mr-2 h-4 w-4" />
              {testBiometric.isPending ? "Running test..." : "Run AWS test"}
            </Button>

            {testResult ? (
              <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="font-medium">{testResult.message}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Detection
                    </p>
                    <p className="mt-2 break-all font-medium text-foreground">
                      {testResult.test_result.face_detected
                        ? "Face detected"
                        : "No face detected"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Faces found
                    </p>
                    <p className="mt-2 break-all font-medium text-foreground">
                      {testResult.test_result.face_count ?? 0}
                    </p>
                  </div>
                </div>
                {testResult.test_result.quality ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Brightness
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {testResult.test_result.quality.brightness ?? "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Sharpness
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {testResult.test_result.quality.sharpness ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {diagnosticError ? (
              <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <p className="font-medium">{diagnosticError.error}</p>
                </div>
                {diagnosticError.details ? (
                  <p className="text-sm text-muted-foreground">{diagnosticError.details}</p>
                ) : null}
                {diagnosticError.configuration ? (
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                    Provider configuration status: {diagnosticError.configuration.status}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!testResult && !diagnosticError ? (
              <TenantEmptyState
                icon={ScanFace}
                title="No test has been run yet"
                description="Once you submit an image source, the provider response and detection details will appear here."
              />
            ) : null}
          </div>
        </TenantSectionCard>
      </div>
    </div>
  );
}
