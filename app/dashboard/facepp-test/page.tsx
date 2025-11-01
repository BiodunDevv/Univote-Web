"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/College/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Scan,
} from "lucide-react";

interface FaceppTestResult {
  message: string;
  test_result: {
    success: boolean;
    face_detected: boolean;
    face_token: string;
    face_rectangle: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    image_id: string;
  };
  configuration: {
    configured: boolean;
    status: string;
  };
}

interface FaceppErrorResult {
  error: string;
  details?: string;
  configuration?: {
    configured: boolean;
    status: string;
  };
}

export default function FaceppTestPage() {
  const router = useRouter();
  const { token, admin } = useAuthStore();
  const { testFacepp } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<FaceppTestResult | null>(null);
  const [errorResult, setErrorResult] = useState<FaceppErrorResult | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token || !admin) {
      router.push("/auth/signin");
      return;
    }

    // Only super admins can access this page
    const isSuperAdmin = admin.role === "super_admin";
    if (!isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [token, admin, router, isHydrated]);

  // Show nothing while hydrating or checking authentication
  if (!isHydrated || !token || !admin || admin.role !== "super_admin") {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setUploadError("");
    setTestResult(null);
    setErrorResult(null);
    setUploadedImageUrl("");

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
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
        throw new Error(
          "Cloudinary configuration is missing. Please check your environment variables."
        );
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "facepp-test");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to upload image");
      }

      const data = await response.json();
      setUploadedImageUrl(data.secure_url);
      setIsUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload image"
      );
      setIsUploading(false);
    }
  };

  const handleTestFacepp = async () => {
    if (!uploadedImageUrl) {
      setUploadError("Please upload an image first");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setErrorResult(null);

    try {
      const result = await testFacepp(token, uploadedImageUrl);
      setTestResult(result as FaceppTestResult);
    } catch (error) {
      console.error("Face++ test error:", error);
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          setErrorResult(errorData as FaceppErrorResult);
        } catch {
          setErrorResult({
            error: "Face++ test failed",
            details: error.message,
          });
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadedImageUrl("");
    setTestResult(null);
    setErrorResult(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Face++ API Test"
        subtitle="Upload an image to test Face++ face detection API"
        onBack={() => router.push("/dashboard")}
        badges={
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scan className="h-4 w-4" />
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Select Image</Label>
                <Input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {previewUrl && (
                <div className="space-y-3">
                  <Label>Preview</Label>
                  <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {!uploadedImageUrl && (
                    <Button
                      onClick={handleUploadToCloudinary}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading to Cloudinary...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload to Cloudinary
                        </>
                      )}
                    </Button>
                  )}

                  {uploadedImageUrl && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <p className="font-medium text-green-600">
                          Image uploaded successfully!
                        </p>
                        <p className="text-xs mt-1 break-all">
                          {uploadedImageUrl}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleTestFacepp}
                  disabled={!uploadedImageUrl || isTesting}
                  className="flex-1"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Face++...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Test Face Detection
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Test Results
                  </>
                ) : errorResult ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Test Failed
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    Awaiting Test
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!testResult && !errorResult && (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Upload an image and run the test to see results</p>
                </div>
              )}

              {/* Success Result */}
              {testResult && (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <p className="font-medium text-green-800">
                        {testResult.message}
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-2">Detection Status</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Success:
                          </span>
                          <span className="font-medium">
                            {testResult.test_result.success ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Face Detected:
                          </span>
                          <span className="font-medium">
                            {testResult.test_result.face_detected
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-2">Face Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground block">
                            Face Token:
                          </span>
                          <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block break-all">
                            {testResult.test_result.face_token}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">
                            Image ID:
                          </span>
                          <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block break-all">
                            {testResult.test_result.image_id}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-2">Face Rectangle</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Top:</span>
                          <span className="font-medium">
                            {testResult.test_result.face_rectangle.top}px
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Left:</span>
                          <span className="font-medium">
                            {testResult.test_result.face_rectangle.left}px
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Width:</span>
                          <span className="font-medium">
                            {testResult.test_result.face_rectangle.width}px
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Height:</span>
                          <span className="font-medium">
                            {testResult.test_result.face_rectangle.height}px
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-2">
                        Configuration Status
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Configured:
                          </span>
                          <span className="font-medium">
                            {testResult.configuration.configured ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">
                            {testResult.configuration.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual representation of face rectangle */}
                    {uploadedImageUrl && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h3 className="font-semibold mb-2">
                          Face Detection Visualization
                        </h3>
                        <div className="relative w-full bg-muted rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={uploadedImageUrl}
                            alt="Detected Face"
                            className="w-full h-auto"
                          />
                          <div
                            className="absolute border-4 border-green-500"
                            style={{
                              top: `${testResult.test_result.face_rectangle.top}px`,
                              left: `${testResult.test_result.face_rectangle.left}px`,
                              width: `${testResult.test_result.face_rectangle.width}px`,
                              height: `${testResult.test_result.face_rectangle.height}px`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Green box shows detected face area
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Result */}
              {errorResult && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">{errorResult.error}</p>
                      {errorResult.details && (
                        <p className="text-sm mt-1">{errorResult.details}</p>
                      )}
                    </AlertDescription>
                  </Alert>

                  {errorResult.configuration && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-2">
                        Configuration Status
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Configured:
                          </span>
                          <span className="font-medium">
                            {errorResult.configuration.configured
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">
                            {errorResult.configuration.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Select an image file containing a clear face (JPG, PNG, or GIF)
              </li>
              <li>Preview the image to ensure it contains a face</li>
              <li>
                Click &quot;Upload to Cloudinary&quot; to upload the image to
                cloud storage
              </li>
              <li>
                Once uploaded, click &quot;Test Face Detection&quot; to test the
                Face++ API
              </li>
              <li>
                View the detection results, including face coordinates and
                tokens
              </li>
              <li>
                The visualization will show a green box around the detected face
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Make sure the Face++ API keys are
                properly configured in your backend .env file (FACEPP_API_KEY
                and FACEPP_API_SECRET).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
