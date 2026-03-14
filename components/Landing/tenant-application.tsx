"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useSubmitTenantApplicationMutation } from "@/lib/queries/public";
import type {
  PublicBillingPlan,
  TenantApplicationPayload,
  TenantApplicationResponse,
} from "@/types/landing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_FORM: TenantApplicationPayload = {
  institution_name: "",
  slug: "",
  primary_domain: "",
  plan_code: "pro_plus",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  institution_type: "university",
  student_count_estimate: 5000,
  admin_count_estimate: 5,
  notes: "",
  demo_requested: true,
};

export function TenantApplicationSection({ plans }: { plans: PublicBillingPlan[] }) {
  const mutation = useSubmitTenantApplicationMutation();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState<{
    name: string;
    status: string;
    checkoutUrl: string | null;
    nextSteps: string[];
    invoiceNumber?: string | null;
  } | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === formData.plan_code) || null,
    [formData.plan_code, plans],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response: TenantApplicationResponse = await mutation.mutateAsync({
        ...formData,
        primary_domain: formData.primary_domain || undefined,
        contact_phone: formData.contact_phone || undefined,
        notes: formData.notes || undefined,
      });

      setSubmitted({
        name: response.application.name,
        status: response.application.status,
        checkoutUrl: response.checkout_url || response.invoice?.provider_checkout_url || null,
        nextSteps: response.next_steps,
        invoiceNumber: response.invoice?.invoice_number || null,
      });
      setFormData(DEFAULT_FORM);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    }
  };

  return (
    <section id="apply" className="py-20">
      <div className="mx-auto max-w-4xl px-4 lg:px-0">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Tenant onboarding
          </Badge>
          <h2 className="mt-4 text-balance text-lg font-semibold sm:text-xl">
            Help us route your institution setup professionally.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Share the organisation profile, choose the starting plan, and move into the
            billing-aware onboarding sequence without guesswork.
          </p>
        </div>

        <div className="border px-4 py-12 lg:px-0 lg:py-20">
          <Card className="mx-auto max-w-2xl border-border/70 p-3 shadow-none sm:p-8">
            {submitted ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {submitted.name} is now in the onboarding queue
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Current stage: {submitted.status.replaceAll("_", " ")}
                    </p>
                    {submitted.invoiceNumber ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Billing reference: {submitted.invoiceNumber}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
                  {submitted.nextSteps.map((step) => (
                    <div key={step} className="flex gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {submitted.checkoutUrl ? (
                    <Button asChild>
                      <a href={submitted.checkoutUrl} target="_self" rel="noreferrer">
                        Continue to secure payment
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => setSubmitted(null)}>
                    Submit another application
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold">Request a Demo or Get Started</h3>
                <p className="mt-4 text-sm text-muted-foreground">
                  Have a question or need a demo? Share your institution details and we&apos;ll
                  move your tenant application into the right onboarding path.
                </p>

                {selectedPlan ? (
                  <div className="mt-8 rounded-2xl border border-border/70 bg-muted/20 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{selectedPlan.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          N{selectedPlan.monthly_price_ngn.toLocaleString()} monthly •{" "}
                          {selectedPlan.support_sla.toLowerCase()} support
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedPlan.limits.admins.toLocaleString()} admins •{" "}
                        {selectedPlan.limits.students.toLocaleString()} students
                      </div>
                    </div>
                  </div>
                ) : null}

                <form
                  onSubmit={handleSubmit}
                  className="**:[&>label]:block mt-12 space-y-6 *:space-y-3"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">  <Label htmlFor="contact-name">
                        Full Name
                      </Label>
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
                    <div className="space-y-1">  <Label htmlFor="contact-email">
                        Email Address
                      </Label>
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">  <Label htmlFor="institution-name">
                        Institution/Organization
                      </Label>
                      <Input
                        id="institution-name"
                        value={formData.institution_name}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            institution_name: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">  <Label htmlFor="tenant-slug">
                        Desired Workspace Slug
                      </Label>
                      <Input
                        id="tenant-slug"
                        value={formData.slug}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">  <Label htmlFor="primary-domain">
                        Preferred Domain
                      </Label>
                      <Input
                        id="primary-domain"
                        value={formData.primary_domain}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            primary_domain: event.target.value,
                          }))
                        }
                        placeholder="votes.school.edu"
                      />
                    </div>
                    <div className="space-y-1">  <Label htmlFor="contact-phone">
                        Phone Number
                      </Label>
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">  <Label htmlFor="plan-code">
                        Starting Plan
                      </Label>
                      <Select
                        value={formData.plan_code}
                        onValueChange={(value) =>
                          setFormData((current) => ({
                            ...current,
                            plan_code: value as TenantApplicationPayload["plan_code"],
                          }))
                        }
                      >
                        <SelectTrigger id="plan-code">
                          <SelectValue placeholder="Choose a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.code} value={plan.code}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">  <Label htmlFor="institution-type">
                        Institution Type
                      </Label>
                      <Select
                        value={formData.institution_type}
                        onValueChange={(value) =>
                          setFormData((current) => ({
                            ...current,
                            institution_type: value as TenantApplicationPayload["institution_type"],
                          }))
                        }
                      >
                        <SelectTrigger id="institution-type">
                          <SelectValue placeholder="Choose a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="polytechnic">Polytechnic</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="institute">Institute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="students-estimate">
                        Estimated Participants
                      </Label>
                      <Input
                        id="students-estimate"
                        type="number"
                        min={1}
                        value={formData.student_count_estimate}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            student_count_estimate: Number(event.target.value) || 0,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">  <Label htmlFor="admins-estimate">
                        Estimated Admins
                      </Label>
                      <Input
                        id="admins-estimate"
                        type="number"
                        min={1}
                        value={formData.admin_count_estimate}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            admin_count_estimate: Number(event.target.value) || 0,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1"><Label htmlFor="notes">
                      Message
                    </Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Tell us about your rollout goals, internal approval process, or what you need from the demo."
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
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
                    <div className="space-y-1" >
                      <Label htmlFor="demo-requested">Request a guided demo</Label>
                      <p className="text-sm text-muted-foreground">
                        We&apos;ll include a product walkthrough in the onboarding follow-up.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <LoadingButtonContent label="Submitting..." />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
