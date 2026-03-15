"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCouponValidationQuery,
  useSubmitTenantApplicationMutation,
  useUpdateTenantApplicationMutation,
} from "@/lib/queries/public";
import type {
  PublicBillingPlan,
  TenantApplicationPayload,
  TenantApplicationResponse,
} from "@/types/landing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "tenant-application-draft-v1";

const DEFAULT_FORM: TenantApplicationPayload = {
  institution_name: "",
  slug: "",
  primary_domain: "",
  plan_code: "pro_plus",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  institution_type: "organization",
  student_count_estimate: 5000,
  admin_count_estimate: 5,
  participant_structure: {
    uses_college: false,
    uses_department: false,
    uses_level: false,
    requires_photo: false,
    requires_face_verification: false,
  },
  identity_preferences: {
    primary_identifier: "email",
    recovery_identifiers: ["email"],
  },
  coupon_code: "",
  notes: "",
  demo_requested: true,
};

const STEPS = [
  "Organization",
  "Contact",
  "Structure",
  "Plan",
  "Billing",
  "Review",
] as const;

type DraftState = {
  reference?: string | null;
  formData: TenantApplicationPayload;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function saveDraftState(value: DraftState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function readDraftState(): DraftState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

function clearDraftState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function TenantApplicationSection({ plans }: { plans: PublicBillingPlan[] }) {
  const createMutation = useSubmitTenantApplicationMutation();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [applicationReference, setApplicationReference] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [couponLookupCode, setCouponLookupCode] = useState("");
  const [submitted, setSubmitted] = useState<TenantApplicationResponse | null>(null);

  const updateMutation = useUpdateTenantApplicationMutation(applicationReference || "");
  const couponQuery = useCouponValidationQuery(
    couponLookupCode,
    formData.plan_code,
    formData.contact_email || "",
    Boolean(couponLookupCode),
  );

  useEffect(() => {
    const draft = readDraftState();
    if (!draft) return;

    setFormData({ ...DEFAULT_FORM, ...draft.formData });
    setApplicationReference(draft.reference || null);
  }, []);

  useEffect(() => {
    saveDraftState({
      reference: applicationReference,
      formData,
    });
  }, [applicationReference, formData]);

  useEffect(() => {
    if (couponQuery.data?.coupon && couponLookupCode) {
      toast.success(`Coupon ${couponQuery.data.coupon.code} applied`);
    }
  }, [couponLookupCode, couponQuery.data?.coupon]);

  useEffect(() => {
    if (couponQuery.error) {
      toast.error(couponQuery.error.message || "Coupon validation failed");
    }
  }, [couponQuery.error]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === formData.plan_code) || null,
    [formData.plan_code, plans],
  );

  const couponSummary = couponQuery.data?.coupon || null;
  const baseAmount = selectedPlan?.monthly_price_ngn || 0;
  const payableAmount = couponSummary?.final_amount_ngn ?? baseAmount;

  const isSavingDraft = createMutation.isPending || updateMutation.isPending;

  async function persistApplication(submit = false) {
    const payload = {
      ...formData,
      primary_domain: formData.primary_domain || undefined,
      contact_phone: formData.contact_phone || undefined,
      notes: formData.notes || undefined,
      coupon_code: formData.coupon_code || undefined,
      submit,
    };

    const response = applicationReference
      ? await updateMutation.mutateAsync(payload)
      : await createMutation.mutateAsync(payload);

    if (response.application.reference) {
      setApplicationReference(response.application.reference);
    }

    return response;
  }

  async function handleNext() {
    try {
      const response = await persistApplication(false);
      if (response.application.reference) {
        setApplicationReference(response.application.reference);
      }
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save draft");
    }
  }

  async function handleSubmit() {
    try {
      const response = await persistApplication(true);
      setSubmitted(response);
      clearDraftState();
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    }
  }

  function updateStructureField(
    key: keyof NonNullable<TenantApplicationPayload["participant_structure"]>,
    value: boolean,
  ) {
    setFormData((current) => ({
      ...current,
      participant_structure: {
        ...current.participant_structure,
        [key]: value,
      },
    }));
  }

  function renderStepContent() {
    if (step === 0) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="institution-name">Organization name</Label>
            <Input
              id="institution-name"
              value={formData.institution_name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, institution_name: event.target.value }))
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
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                }))
              }
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
                setFormData((current) => ({ ...current, primary_domain: event.target.value }))
              }
              placeholder="votes.organization.org"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization type</Label>
            <Select
              value={formData.institution_type}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  institution_type: value as TenantApplicationPayload["institution_type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="polytechnic">Polytechnic</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Onboarding note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Tell us about rollout timing, special requirements, or target launch period."
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
                setFormData((current) => ({ ...current, contact_name: event.target.value }))
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
                setFormData((current) => ({ ...current, contact_email: event.target.value }))
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
                setFormData((current) => ({ ...current, contact_phone: event.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-4">
            <Checkbox
              id="demo-requested"
              checked={formData.demo_requested}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, demo_requested: checked === true }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="demo-requested">Request a guided onboarding demo</Label>
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
              <Label htmlFor="participants-estimate">Expected participants</Label>
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
            {[
              ["uses_college", "Use college/grouping layer"],
              ["uses_department", "Use department/unit layer"],
              ["uses_level", "Use level/class/year layer"],
              ["requires_photo", "Collect participant photo"],
              ["requires_face_verification", "Require biometric verification"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-3 rounded-2xl border p-4">
                <Checkbox
                  id={key}
                  checked={Boolean(formData.participant_structure?.[key as keyof typeof formData.participant_structure])}
                  onCheckedChange={(checked) =>
                    updateStructureField(
                      key as keyof NonNullable<TenantApplicationPayload["participant_structure"]>,
                      checked === true,
                    )
                  }
                />
                <Label htmlFor={key}>{label}</Label>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary login identifier</Label>
              <Select
                value={formData.identity_preferences?.primary_identifier || "email"}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    identity_preferences: {
                      ...current.identity_preferences,
                      primary_identifier: value as NonNullable<
                        TenantApplicationPayload["identity_preferences"]
                      >["primary_identifier"],
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="member_id">Member ID</SelectItem>
                  <SelectItem value="employee_id">Employee ID</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="matric_no">Matric number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              These settings seed the initial tenant configuration and can still be refined later
              from the admin settings workspace.
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const active = formData.plan_code === plan.code;
            return (
              <button
                type="button"
                key={plan.code}
                className={`rounded-[1.5rem] border p-5 text-left transition ${
                  active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                }`}
                onClick={() => setFormData((current) => ({ ...current, plan_code: plan.code }))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{plan.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMoney(plan.monthly_price_ngn)} / month
                    </p>
                  </div>
                  {active ? <Badge>Selected</Badge> : null}
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>{plan.support_sla} support SLA</p>
                  <p>{plan.limits.admins.toLocaleString()} admins</p>
                  <p>{plan.limits.students.toLocaleString()} participants</p>
                  <p>{plan.limits.active_sessions.toLocaleString()} active sessions</p>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Coupon code</Label>
              <Input
                id="coupon-code"
                value={formData.coupon_code}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    coupon_code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="SPRING100"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCouponLookupCode(formData.coupon_code || "")}
                disabled={!formData.coupon_code}
              >
                <TicketPercent className="mr-2 size-4" />
                Apply
              </Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border bg-muted/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Billing summary</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPlan?.name || "Selected plan"} onboarding starts after payment and
                  platform review.
                </p>
              </div>
              <CreditCard className="size-5 text-primary" />
            </div>
            <Separator className="my-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan amount</span>
                <span className="font-medium">{formatMoney(baseAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Coupon discount</span>
                <span className="font-medium text-emerald-600">
                  -{formatMoney(couponSummary?.discount_amount_ngn || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-base">
                <span className="font-semibold">Payable now</span>
                <span className="font-semibold">{formatMoney(payableAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Organization:</span> {formData.institution_name}
              </p>
              <p>
                <span className="text-muted-foreground">Workspace:</span> {formData.slug}
              </p>
              <p>
                <span className="text-muted-foreground">Contact:</span> {formData.contact_name} ·{" "}
                {formData.contact_email}
              </p>
              <p>
                <span className="text-muted-foreground">Plan:</span> {selectedPlan?.name}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Operational setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Photo required:</span>{" "}
                {formData.participant_structure?.requires_photo ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-muted-foreground">Face verification:</span>{" "}
                {formData.participant_structure?.requires_face_verification ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-muted-foreground">Hierarchy:</span>{" "}
                {[
                  formData.participant_structure?.uses_college ? "College" : null,
                  formData.participant_structure?.uses_department ? "Department" : null,
                  formData.participant_structure?.uses_level ? "Level" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "Flat participant structure"}
              </p>
              <p>
                <span className="text-muted-foreground">Initial payment:</span>{" "}
                {formatMoney(payableAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-[1.5rem] border border-dashed p-4 text-sm text-muted-foreground">
          Once submitted, you will receive a reference, a payment link if required, and a public
          status page where you can monitor approval and retry payment if needed.
        </div>
      </div>
    );
  }

  return (
    <section id="apply" className="py-20">
      <div className="mx-auto max-w-5xl px-4 lg:px-0">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Tenant onboarding
          </Badge>
          <h2 className="mt-4 text-balance text-xl font-semibold sm:text-2xl">
            Launch a workspace with a guided, billing-aware application flow.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Save your draft, review structure and identity preferences, apply coupons, and track
            approval from a dedicated status page after submission.
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
                    : "A draft reference is generated automatically once you start."}
                </CardDescription>
              </div>
              <Badge variant="secondary">Step {step + 1} of {STEPS.length}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-6">
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
                <div className="flex items-start gap-4 rounded-[1.5rem] border bg-primary/5 p-5">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <FileCheck2 className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{submitted.application.name} is now in the onboarding queue</h3>
                    <p className="text-sm text-muted-foreground">
                      Reference: {submitted.application.reference || "Pending"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {submitted.application.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.5rem] border p-5">
                  {submitted.next_steps.map((item) => (
                    <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {submitted.checkout_url ? (
                    <Button asChild>
                      <a href={submitted.checkout_url} target="_self" rel="noreferrer">
                        Continue payment
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <Link
                      href={`/application-status?reference=${encodeURIComponent(
                        submitted.application.reference || "",
                      )}&email=${encodeURIComponent(submitted.application.contact_email || "")}`}
                    >
                      Track application
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSubmitted(null);
                      setApplicationReference(null);
                      setFormData(DEFAULT_FORM);
                      setStep(0);
                    }}
                  >
                    Start another application
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {renderStepContent()}

                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {step === STEPS.length - 1
                      ? "Submitting will create or continue billing and move the application into review."
                      : "Your draft is saved as you continue through each step."}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((current) => Math.max(current - 1, 0))}
                      disabled={step === 0 || isSavingDraft}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                      <Button type="button" onClick={handleNext} disabled={isSavingDraft}>
                        {isSavingDraft ? (
                          <LoadingButtonContent label="Saving draft" />
                        ) : (
                          <>
                            Next
                            <ArrowRight className="ml-2 size-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button type="button" onClick={handleSubmit} disabled={isSavingDraft}>
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
