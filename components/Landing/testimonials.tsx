"use client";

import type { LandingTestimonial } from "@/types/landing";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { useState } from "react";
import { toast } from "sonner";
import { usePublicOrganizationsQuery, useSubmitTestimonialMutation } from "@/lib/queries/public";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Briefcase, Building2, MessageSquare, User } from "lucide-react";

function toUsername(name: string) {
  return `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function buildFallbackAvatar(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#e7eefb" /><text x="50%" y="54%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#193b6b">${initials}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

type ReviewItem = {
  id: string;
  name: string;
  username: string;
  body: string;
  img: string;
  role: string;
  org: string;
};

const ReviewCard = ({
  img,
  name,
  username,
  body,
  size = "default",
}: {
  img: string;
  name: string;
  username: string;
  body: string;
  size?: "default" | "lg";
}) => {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border p-4",
        "border-gray-950/10 bg-gray-950/10 hover:bg-gray-950/5",
        "dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15",
        size === "default" ? "h-full w-64" : "w-full max-w-lg",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img
          className="rounded-full"
          width="32"
          height="32"
          alt={name}
          src={img}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

/** Marquee layout — used when there are 4+ testimonials */
function MarqueeLayout({ reviews }: { reviews: ReviewItem[] }) {
  const mid = Math.ceil(reviews.length / 2);
  const firstRow = reviews.slice(0, mid);
  const secondRow = reviews.slice(mid);

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((r) => (
          <ReviewCard key={r.id} img={r.img} name={r.name} username={r.username} body={r.body} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((r) => (
          <ReviewCard key={`${r.id}-r`} img={r.img} name={r.name} username={r.username} body={r.body} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background" />
    </div>
  );
}

/** Grid layout — used when there are 2 or 3 testimonials */
function GridLayout({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div
        className={cn(
          "grid gap-4",
          reviews.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {reviews.map((r) => (
          <figure
            key={r.id}
            className={cn(
              "rounded-xl border p-5",
              "border-gray-950/10 bg-gray-950/10",
              "dark:border-gray-50/10 dark:bg-gray-50/10",
            )}
          >
            <div className="flex items-center gap-3">
              <img className="rounded-full" width="40" height="40" alt={r.name} src={r.img} />
              <div>
                <figcaption className="text-sm font-medium">{r.name}</figcaption>
                <p className="text-xs text-muted-foreground">
                  {r.role}
                  {r.org ? ` · ${r.org}` : ""}
                </p>
              </div>
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{r.body}&rdquo;
            </blockquote>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Single card — used when there is exactly 1 testimonial */
function SingleLayout({ review }: { review: ReviewItem }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      <figure className="rounded-2xl border p-8 text-center border-gray-950/10 bg-gray-950/10 dark:border-gray-50/10 dark:bg-gray-50/10">
        <img
          className="mx-auto mb-4 rounded-full"
          width="56"
          height="56"
          alt={review.name}
          src={review.img}
        />
        <blockquote className="text-base leading-relaxed text-foreground">
          &ldquo;{review.body}&rdquo;
        </blockquote>
        <figcaption className="mt-4">
          <p className="text-sm font-semibold">{review.name}</p>
          <p className="text-xs text-muted-foreground">
            {review.role}
            {review.org ? ` · ${review.org}` : ""}
          </p>
        </figcaption>
      </figure>
    </div>
  );
}

function SubmitDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    author_name: "",
    author_role: "",
    institution_name: "",
    quote: "",
  });
  const submitMutation = useSubmitTestimonialMutation();
  const orgsQuery = usePublicOrganizationsQuery();

  const organizations = [...(orgsQuery.data?.organizations ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function reset() {
    setForm({ author_name: "", author_role: "", institution_name: "", quote: "" });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-5">
          Submit a testimonial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a testimonial</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await submitMutation.mutateAsync(form);
              toast.success("Testimonial submitted for review");
              setOpen(false);
              reset();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to submit testimonial");
            }
          }}
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="submit-name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full name
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="submit-name"
                    value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="submit-role" className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Role
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="submit-role"
                    value={form.author_role}
                    onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))}
                    placeholder="e.g. 300L Student, Senior Lecturer"
                    autoComplete="organization-title"
                    required
                  />
                </InputGroup>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="submit-org" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Institution
              </FieldLabel>
              {organizations.length > 0 ? (
                <Select
                  value={form.institution_name}
                  onValueChange={(v) => setForm((f) => ({ ...f, institution_name: v }))}
                  required
                >
                  <SelectTrigger id="submit-org">
                    <SelectValue placeholder="Select your university…" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.name}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Building2 className="h-3.5 w-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="submit-org"
                    value={form.institution_name}
                    onChange={(e) => setForm((f) => ({ ...f, institution_name: e.target.value }))}
                    placeholder="University or institution name"
                    autoComplete="organization"
                    required
                  />
                </InputGroup>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="submit-review" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                Your review
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="submit-review"
                  rows={4}
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  placeholder="Tell us about your experience with Univote…"
                  minLength={20}
                  required
                />
              </InputGroup>
              <FieldDescription>Minimum 20 characters. All testimonials are reviewed before publication.</FieldDescription>
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending || !form.institution_name}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: LandingTestimonial[];
}) {
  const reviews: ReviewItem[] = testimonials.map((t) => ({
    id: t.id,
    name: t.author_name,
    username: toUsername(t.author_name),
    body: t.quote,
    img: t.avatar_url || buildFallbackAvatar(t.author_name),
    role: t.author_role,
    org: t.institution_name,
  }));

  const count = reviews.length;

  return (
    <section id="stories" className="py-16 md:py-32">
      {/* Header */}
      <div className="mx-auto max-w-5xl px-2 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-semibold lg:text-5xl">
            What People Are Saying
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Published stories are moderated by the platform team. You can submit your own review for consideration.
          </p>
          <SubmitDialog />
        </div>
      </div>

      {/* Adaptive display */}
      {count === 0 ? null : count === 1 ? (
        <SingleLayout review={reviews[0]} />
      ) : count <= 3 ? (
        <GridLayout reviews={reviews} />
      ) : (
        <MarqueeLayout reviews={reviews} />
      )}

      {/* Footer note */}
      {count > 0 && (
        <div className="mx-auto mt-8 max-w-5xl px-2 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Every testimonial shown here is published from the platform moderation queue, not a static hardcoded list.
          </p>
        </div>
      )}
    </section>
  );
}
