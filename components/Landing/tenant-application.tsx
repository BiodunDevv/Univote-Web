"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import {
  useSubmitTenantApplicationMutation,
  useTenantApplicationStatusQuery,
  useUpdateTenantApplicationMutation,
} from "@/lib/queries/public";
import type {
  TenantApplicationPayload,
  TenantApplicationResponse,
} from "@/types/landing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Textarea } from "@/components/ui/textarea";
import {
  clearTrackedTenantApplication,
  readTrackedTenantApplication,
  shouldKeepTrackedApplication,
  writeTrackedTenantApplication,
} from "@/lib/tenant-application-tracker";

const DEFAULT_FORM: TenantApplicationPayload = {
  institution_name: "",
  slug: "",
  primary_domain: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  institution_type: "university",
  student_count_estimate: 5000,
  admin_count_estimate: 5,
  notes: "",
  demo_requested: true,
};

const STEPS = ["University", "Contact", "Capacity"] as const;

function suggestDomain(slug: string): string {
  if (typeof window === "undefined" || !slug) return "";
  const { hostname, port } = window.location;
  if (hostname === "localhost") {
    return port ? `localhost:${port}` : "localhost:3000";
  }
  return `${slug}.${hostname}`;
}

export function TenantApplicationSection() {
  const createMutation = useSubmitTenantApplicationMutation();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [applicationReference, setApplicationReference] = useState<
    string | null
  >(null);
  const [trackedApplication, setTrackedApplication] = useState<{
    reference: string;
    email: string;
    name?: string | null;
    status?: string | null;
  } | null>(null);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<TenantApplicationResponse | null>(
    null,
  );
  const [lookupEmail, setLookupEmail] = useState("");

  const updateMutation = useUpdateTenantApplicationMutation(
    applicationReference || "",
  );
  const existingApplicationQuery = useTenantApplicationStatusQuery(
    lookupEmail,
    undefined,
    step >= 1 && /\S+@\S+\.\S+/.test(lookupEmail),
  );

  useEffect(() => {
    const tracked = readTrackedTenantApplication();
    if (!tracked) return;
    if (!shouldKeepTrackedApplication(tracked.status)) {
      clearTrackedTenantApplication();
      return;
    }

    setTrackedApplication(tracked);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLookupEmail(formData.contact_email.trim().toLowerCase());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [formData.contact_email]);

  useEffect(() => {
    const application = existingApplicationQuery.data?.application;
    if (!application) return;

    if (shouldKeepTrackedApplication(application.status)) {
      const nextTracked = {
        reference: application.reference || "",
        email: application.contact_email || lookupEmail,
        name: application.name,
        status: application.status,
      };
      setTrackedApplication(nextTracked);
      writeTrackedTenantApplication(nextTracked);
      return;
    }

    clearTrackedTenantApplication();
    setTrackedApplication(null);
  }, [existingApplicationQuery.data?.application, lookupEmail]);

  const isSavingDraft = createMutation.isPending || updateMutation.isPending;

  async function persistApplication(submit = false) {
    const payload = {
      ...formData,
      institution_type: "university" as const,
      primary_domain: formData.primary_domain || undefined,
      contact_phone: formData.contact_phone || undefined,
      notes: formData.notes || undefined,
      submit,
    };

    const response = applicationReference
      ? await updateMutation.mutateAsync(payload)
      : await createMutation.mutateAsync(payload);

    if (response.application.reference) {
      setApplicationReference(response.application.reference);
      if (shouldKeepTrackedApplication(response.application.status)) {
        const nextTracked = {
          reference: response.application.reference,
          email: response.application.contact_email || formData.contact_email,
          name: response.application.name,
          status: response.application.status,
        };
        setTrackedApplication(nextTracked);
        writeTrackedTenantApplication(nextTracked);
      } else {
        clearTrackedTenantApplication();
        setTrackedApplication(null);
      }
    }

    return response;
  }

  function handleNext() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    try {
      const response = await persistApplication(true);
      setSubmitted(response);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application",
      );
    }
  }

  const existingApplication = useMemo(
    () => existingApplicationQuery.data?.application || null,
    [existingApplicationQuery.data?.application],
  );

  function renderStepContent() {
    if (step === 0) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="institution-name">University name</Label>
            <Input
              id="institution-name"
              value={formData.institution_name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  institution_name: event.target.value,
                }))
              }
              placeholder="Summit Institute"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-slug">Workspace slug</Label>
            <Input
              id="tenant-slug"
              value={formData.slug}
              onChange={(event) => {
                const newSlug = event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-");
                setFormData((current) => {
                  const wasAutoFilled =
                    !current.primary_domain ||
                    current.primary_domain === suggestDomain(current.slug);
                  return {
                    ...current,
                    slug: newSlug,
                    primary_domain: wasAutoFilled
                      ? suggestDomain(newSlug)
                      : current.primary_domain,
                  };
                });
              }}
              placeholder="summit-demo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary-domain">Preferred custom domain</Label>
            <Input
              id="primary-domain"
              value={formData.primary_domain}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  primary_domain: event.target.value,
                }))
              }
              placeholder="votes.organization.org"
            />
          </div>
          <div className="space-y-2">
            <Label>Institution type</Label>
            <Input value="University" disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Application note (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Tell us your rollout period, election timeline, or any special compliance needs."
              rows={4}
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Primary admin contact</Label>
            <Input
              id="contact-name"
              value={formData.contact_name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  contact_name: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Work email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.contact_email}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  contact_email: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone number</Label>
            <Input
              id="contact-phone"
              value={formData.contact_phone}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  contact_phone: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-4">
            <Checkbox
              id="demo-requested"
              checked={formData.demo_requested}
              onCheckedChange={(checked) =>
                setFormData((current) => ({
                  ...current,
                  demo_requested: checked === true,
                }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="demo-requested">
                Request a guided onboarding demo
              </Label>
              <p className="text-xs text-muted-foreground">
                We will schedule a live walkthrough before approval if needed.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="participants-estimate">Expected students</Label>
              <Input
                id="participants-estimate"
                type="number"
                min={0}
                value={formData.student_count_estimate ?? 0}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    student_count_estimate: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admins-estimate">Expected admins</Label>
              <Input
                id="admins-estimate"
                type="number"
                min={0}
                value={formData.admin_count_estimate ?? 0}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    admin_count_estimate: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/25 p-4">
              <p className="text-sm font-semibold">
                University structure is fixed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Colleges, departments, and levels are enabled by default for
                every new university workspace.
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/25 p-4">
              <p className="text-sm font-semibold">
                Face verification is mandatory
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Face verification and photo requirements are automatically
                enforced for all tenants.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 lg:px-0">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
          >
            University onboarding
          </Badge>
          <h2 className="mt-4 text-balance text-xl font-semibold sm:text-2xl">
            Apply in three focused steps.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            University-first onboarding with one clear approval flow and no payment setup.
            University defaults are applied automatically.
          </p>
        </div>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Workspace application</CardTitle>
                <CardDescription>
                  {applicationReference
                    ? `Draft reference: ${applicationReference}`
                    : "A draft reference is generated automatically as soon as you start."}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                Step {step + 1} of {STEPS.length}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {STEPS.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    index === step
                      ? "border-primary bg-primary/5"
                      : index < step
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border bg-background"
                  }`}
                  onClick={() => setStep(index)}
                >
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 font-medium">{label}</div>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {submitted ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-3xl border bg-primary/5 p-5">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <FileCheck2 className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {submitted.application.name} is now in the onboarding
                      queue
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Reference: {submitted.application.reference || "Pending"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status:{" "}
                      {submitted.application.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Your application is in the review queue. Track its progress
                    using the link below.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" asChild>
                    <Link
                      href={`/application-status?reference=${encodeURIComponent(
                        submitted.application.reference || "",
                      )}&email=${encodeURIComponent(submitted.application.contact_email || "")}`}
                    >
                      Track application
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 size-4" />
                      Back to home
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSubmitted(null);
                      setApplicationReference(null);
                      setFormData(DEFAULT_FORM);
                      setStep(0);
                      clearTrackedTenantApplication();
                      setTrackedApplication(null);
                    }}
                  >
                    Start another application
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {trackedApplication ? (
                  <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Existing application available
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trackedApplication.name || "University application"} •{" "}
                        {trackedApplication.reference}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <Link
                          href={`/application-status?reference=${encodeURIComponent(trackedApplication.reference)}&email=${encodeURIComponent(trackedApplication.email)}`}
                        >
                          Check status
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          clearTrackedTenantApplication();
                          setTrackedApplication(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : null}

                {formData.contact_email && existingApplication ? (
                  <div className="rounded-2xl border bg-primary/5 p-4">
                    <p className="text-sm font-medium">
                      An application already exists for this email
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {existingApplication.name} •{" "}
                      {existingApplication.reference} •{" "}
                      {existingApplication.status.replaceAll("_", " ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <Link
                          href={`/application-status?reference=${encodeURIComponent(existingApplication.reference || "")}&email=${encodeURIComponent(existingApplication.contact_email || formData.contact_email)}`}
                        >
                          Review existing application
                        </Link>
                      </Button>
                      {shouldKeepTrackedApplication(
                        existingApplication.status,
                      ) ? (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const nextTracked = {
                              reference: existingApplication.reference || "",
                              email:
                                existingApplication.contact_email ||
                                formData.contact_email,
                              name: existingApplication.name,
                              status: existingApplication.status,
                            };
                            writeTrackedTenantApplication(nextTracked);
                            setTrackedApplication(nextTracked);
                          }}
                        >
                          Keep tracked
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {renderStepContent()}

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Submission enables university defaults automatically: college,
                  department, level, photo requirement, and compulsory face
                  verification.
                </div>

                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Submitting will move the application into super-admin
                    verification.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="ghost" asChild>
                      <Link
                        href={
                          formData.contact_email
                            ? `/application-status?email=${encodeURIComponent(formData.contact_email)}`
                            : "/application-status"
                        }
                      >
                        Track existing application
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setStep((current) => Math.max(current - 1, 0))
                      }
                      disabled={step === 0}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                      <Button type="button" onClick={handleNext}>
                        Next
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSavingDraft}
                      >
                        {isSavingDraft ? (
                          <LoadingButtonContent label="Submitting" />
                        ) : (
                          "Submit application"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
