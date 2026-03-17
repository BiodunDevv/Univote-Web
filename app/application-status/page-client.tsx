"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  Loader2,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useTenantApplicationStatusQuery } from "@/lib/queries/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function toTitleCase(value?: string | null) {
  if (!value) return "Not available";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function getApplicationStatusTone(status?: string) {
  if (status === "active" || status === "approved") {
    return {
      icon: ShieldCheck,
      label: "Approved",
      description: "The workspace is approved and ready for access.",
      className: "text-emerald-600",
    };
  }

  if (status === "draft") {
    return {
      icon: RefreshCcw,
      label: "Needs update",
      description:
        "The application has been returned for changes before approval.",
      className: "text-amber-600",
    };
  }

  return {
    icon: Clock3,
    label: "In review",
    description:
      "Application has been submitted and is waiting for super-admin verification.",
    className: "text-primary",
  };
}

export default function ApplicationStatusClientPage() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(
    searchParams.get("reference") || "",
  );
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [submitted, setSubmitted] = useState(Boolean(email));
  const statusQuery = useTenantApplicationStatusQuery(
    email,
    reference,
    submitted,
  );

  const application = statusQuery.data?.application;
  const statusTone = getApplicationStatusTone(application?.status);
  const timeline = useMemo(
    () => application?.status_timeline || [],
    [application?.status_timeline],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pb-10 pt-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/10 to-transparent" />

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Real-time onboarding verification status
            </div>
            <div>
              <CardTitle className="text-2xl">Track your application</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Use the same submitted work email to retrieve your application.
                Reference is optional but helps if the same email has multiple
                applications.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Submitted work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value.toLowerCase())
                    }
                    placeholder="owner@organization.org"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">
                  Application reference (optional)
                </Label>
                <div className="relative">
                  <Receipt className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value.toUpperCase())
                    }
                    placeholder="APP-20260315-AB12CD"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full lg:w-auto">
                  Check status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {statusQuery.isFetching ? (
          <Card className="shadow-none">
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading application status...
            </CardContent>
          </Card>
        ) : statusQuery.error ? (
          <Card className="border-destructive/40 shadow-none">
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <AlertCircle className="size-4 text-destructive" />
              {statusQuery.error.message}
            </CardContent>
          </Card>
        ) : application ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="shadow-none">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        {application.name}
                      </CardTitle>
                      <CardDescription>
                        {application.reference || "Reference pending"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {toTitleCase(application.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                    <statusTone.icon
                      className={`mt-0.5 size-5 ${statusTone.className}`}
                    />
                    <div className="space-y-1">
                      <p className="font-medium">{statusTone.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {statusTone.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Submitted email:
                        </span>{" "}
                        {application.contact_email || "Not available"}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Submitted:
                        </span>{" "}
                        {formatDate(application.application_submitted_at)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Last update:
                        </span>{" "}
                        {formatDate(application.application_last_updated_at)}
                      </p>
                      {application.rejection_reason ? (
                        <p>
                          <span className="text-muted-foreground">
                            Review note:
                          </span>{" "}
                          {application.rejection_reason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Verification snapshot</CardTitle>
                  <CardDescription>
                    Review the current review flow and available actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                    <Clock3 className="mt-0.5 size-5 text-primary" />
                    <div>
                      <p className="font-medium">Application in workflow</p>
                      <p className="text-sm text-muted-foreground">
                        {application.rejection_reason
                          ? "Updates are required before approval."
                          : "Application is being reviewed by super admin."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {statusQuery.data?.next_actions
                      ?.filter((action) => action.href)
                      .map((action) => (
                        <Button
                          key={action.key}
                          asChild
                          className="w-full justify-start"
                        >
                          <a
                            href={action.href || "#"}
                            target="_self"
                            rel="noreferrer"
                          >
                            {action.label}
                          </a>
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>
                  Latest milestones in your onboarding lifecycle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No timeline events available yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div
                        key={`${item.status}-${index}`}
                        className="flex gap-3 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                        <div className="space-y-1">
                          <p className="font-medium">
                            {item.label || toTitleCase(item.status)}
                          </p>
                          <p className="text-muted-foreground">
                            {formatDate(item.at)}
                          </p>
                          {item.note ? (
                            <p className="text-muted-foreground">{item.note}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/">Back to home</Link>
              </Button>
              <Separator
                orientation="vertical"
                className="hidden h-6 sm:block"
              />
              <p className="text-xs text-muted-foreground">
                Tip: You can check status any time using only the same submitted
                email.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
