"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminSystemConfigQuery,
  useTestEmailMutation,
  useTestFaceppMutation,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function IntegrationsPage() {
  const configQuery = useAdminSystemConfigQuery();
  const testEmail = useTestEmailMutation();
  const testFacepp = useTestFaceppMutation();
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  if (configQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading system integrations...",
          "Checking delivery providers...",
          "Preparing verification tools...",
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
      title: "Face++",
      configured: config.facepp.configured,
      details: config.facepp.configured
        ? `Base URL: ${config.facepp.base_url}`
        : "Face verification keys are missing.",
    },
    {
      title: "Email",
      configured: config.email.configured,
      details: config.email.configured
        ? `SMTP host: ${config.email.smtp_host}:${config.email.smtp_port}`
        : "SMTP credentials are not fully configured.",
    },
    {
      title: "Database",
      configured: config.database.connected,
      details: config.database.connected
        ? "Database connectivity is healthy."
        : "Database connection needs attention.",
    },
    {
      title: "JWT",
      configured: config.jwt.configured,
      details: config.jwt.configured
        ? `Student expiry: ${config.jwt.student_token_expiry}`
        : "JWT secret is missing.",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Integrations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor delivery and verification services, then run safe connectivity checks from the dashboard.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {integrations.map((item) => (
          <Card key={item.title} className="border shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <Badge variant="outline">
                  {item.configured ? "Configured" : "Needs setup"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Test email delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="integration-email">Recipient email</Label>
              <Input
                id="integration-email"
                type="email"
                placeholder="admin@example.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button
              disabled={testEmail.isPending || !email}
              onClick={async () => {
                await testEmail.mutateAsync(email);
                toast.success("Test email sent");
              }}
            >
              {testEmail.isPending ? "Sending..." : "Send test email"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Test Face++ detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="integration-facepp">Image URL</Label>
              <Input
                id="integration-facepp"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </div>
            <Button
              disabled={testFacepp.isPending || !imageUrl}
              onClick={async () => {
                await testFacepp.mutateAsync(imageUrl);
                toast.success("Face++ test completed");
              }}
            >
              {testFacepp.isPending ? "Testing..." : "Run Face++ test"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {(testEmail.error || testFacepp.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {(testEmail.error as Error | undefined)?.message ||
              (testFacepp.error as Error | undefined)?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
