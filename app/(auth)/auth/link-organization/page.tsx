"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { useAuthStore } from "@/lib/store/useAuthStore";

function LinkOrganizationPageContent() {
  const router = useRouter();
  const { token, admin, tenant, hasHydrated, linkOrganization, isLoading, error, clearError } =
    useAuthStore();
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");

  const currentWorkspaceName = useMemo(
    () => tenant?.name || "current workspace",
    [tenant?.name],
  );

  if (!hasHydrated) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Loading workspace access...",
          "Checking admin session...",
          "Preparing organization linking...",
        ]}
      />
    );
  }

  if (!token || !admin || admin.role === "super_admin") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Tenant admin session required</CardTitle>
            <CardDescription>
              Sign into a tenant workspace first, then add another organization from there.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/auth/signin">Go to sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xl space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="h-9 w-fit text-xs"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back
        </Button>

        <Card className="border shadow-none">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              Linked organization access
            </div>
            <div>
              <CardTitle>Add another organization</CardTitle>
              <CardDescription className="mt-1">
                Connect a different tenant-admin account to {currentWorkspaceName} so you can
                switch workspaces later without signing out.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Enter the other organization&apos;s admin credentials once. Univote will store the
                link securely and keep permissions scoped to that linked account.
              </AlertDescription>
            </Alert>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form
              className="space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                clearError();
                try {
                  await linkOrganization(
                    tenantSlug.trim().toLowerCase(),
                    email.trim(),
                    password,
                    label.trim() || undefined,
                  );
                  toast.success("Organization linked successfully");
                  router.replace("/dashboard/settings?tab=linked-organizations");
                } catch {
                  return;
                }
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tenantSlug">Organization slug</FieldLabel>
                  <Input
                    id="tenantSlug"
                    value={tenantSlug}
                    onChange={(event) => setTenantSlug(event.target.value)}
                    placeholder="summit-demo"
                    disabled={isLoading}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Admin email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@organization.org"
                    disabled={isLoading}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Admin password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="label">Internal label</FieldLabel>
                  <Input
                    id="label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Secondary owner account"
                    disabled={isLoading}
                  />
                </Field>
              </FieldGroup>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isLoading} className="sm:flex-1">
                  {isLoading ? "Linking organization..." : "Link organization"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push("/dashboard/settings?tab=linked-organizations")
                  }
                  className="sm:flex-1"
                >
                  Manage linked organizations
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LinkOrganizationPage() {
  return (
    <Suspense
      fallback={
        <ChangingLoadingState
          fullHeight
          messages={[
            "Loading workspace access...",
            "Checking admin session...",
            "Preparing organization linking...",
          ]}
        />
      }
    >
      <LinkOrganizationPageContent />
    </Suspense>
  );
}
