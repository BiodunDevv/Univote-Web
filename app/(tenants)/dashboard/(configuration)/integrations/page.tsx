"use client";

import { useState } from "react";
import { Mail, Plug, ScanFace, Server } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminSystemConfigQuery,
  useTestEmailMutation,
  useTestBiometricMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

export default function IntegrationsPage() {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const configQuery = useAdminSystemConfigQuery();
  const testEmail = useTestEmailMutation();
  const testBiometric = useTestBiometricMutation();
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  if (configQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading system integrations...",
          "Checking delivery providers...",
          "Preparing biometric tools...",
        ]}
      />
    );
  }

  const config = configQuery.data?.system_config;

  if (!config || configQuery.error) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(configQuery.error as Error | undefined)?.message ||
            "Integration settings could not be loaded."}
        </CardContent>
      </Card>
    );
  }

  const integrations = [
    {
      title: "AWS Rekognition",
      configured: config.biometrics.configured,
      details: config.biometrics.configured
        ? `Region: ${config.biometrics.region || "Not set"}`
        : "AWS biometric credentials are not fully configured.",
      icon: <ScanFace className="h-4 w-4" />,
    },
    {
      title: "Email",
      configured: config.email.configured,
      details: config.email.configured
        ? `SMTP host: ${config.email.smtp_host}:${config.email.smtp_port}`
        : "SMTP credentials are not fully configured.",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      title: "Database",
      configured: config.database.connected,
      details: config.database.connected
        ? "Database connectivity is healthy."
        : "Database connection needs attention.",
      icon: <Server className="h-4 w-4" />,
    },
    {
      title: "JWT",
      configured: config.jwt.configured,
      details: config.jwt.configured
        ? `${participantLabels.singular} token expiry: ${config.jwt.student_token_expiry}`
        : "JWT secret is missing.",
      icon: <Plug className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant configuration"
        icon={<Plug className="h-5 w-5" />}
        title="Integrations"
        subtitle="Inspect delivery and verification services, then run safe operational tests from a consistent admin workspace."
        stats={[
          {
            label: "Configured",
            value: integrations.filter((item) => item.configured).length.toString(),
          },
          {
            label: "Needs setup",
            value: integrations.filter((item) => !item.configured).length.toString(),
          },
          {
            label: "Email",
            value: config.email.configured ? "Ready" : "Pending",
          },
          {
            label: "Biometrics",
            value: config.biometrics.configured ? "Ready" : "Pending",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TenantSectionCard
          title="Test email delivery"
          description="Send a real message through the configured email provider before relying on production notifications."
          contentClassName="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="integration-email">Recipient email</Label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Mail className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                id="integration-email"
                type="email"
                placeholder="admin@example.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </InputGroup>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            <span>SMTP provider</span>
            <Badge variant="outline">
              {config.email.configured ? "Configured" : "Pending"}
            </Badge>
          </div>
          <Button
            disabled={testEmail.isPending || !email}
            onClick={async () => {
              await testEmail.mutateAsync(email);
              toast.success("Test email sent");
            }}
            className="h-10"
          >
            {testEmail.isPending ? "Sending..." : "Send test email"}
          </Button>
        </TenantSectionCard>

        <TenantSectionCard
          title="Test AWS biometric detection"
          description="Run a safe verification request using a supplied image URL to confirm the AWS Rekognition path is responsive."
          contentClassName="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="integration-biometric">Image URL</Label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <ScanFace className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                id="integration-biometric"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </InputGroup>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            <span>AWS region</span>
            <span className="font-medium text-foreground">
              {config.biometrics.region || "Not configured"}
            </span>
          </div>
          <Button
            disabled={testBiometric.isPending || !imageUrl}
            onClick={async () => {
              await testBiometric.mutateAsync(imageUrl);
              toast.success("AWS biometric test completed");
            }}
            className="h-10"
          >
            {testBiometric.isPending ? "Testing..." : "Run AWS test"}
          </Button>
        </TenantSectionCard>
      </div>

      {testEmail.error || testBiometric.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(testEmail.error as Error | undefined)?.message ||
              (testBiometric.error as Error | undefined)?.message}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
