"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Hash,
  ImageOff,
  Link2,
  MessageSquare,
  Star,
  User,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePlatformTestimonialMutation,
  useUpdatePlatformTestimonialMutation,
} from "@/lib/queries/platform";
import type { LandingTestimonial } from "@/types/landing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_FORM = {
  author_name: "",
  author_role: "",
  institution_name: "",
  quote: "",
  avatar_url: "",
  rating: 5,
  status: "draft" as "draft" | "pending_review" | "published" | "rejected",
  highlighted: false,
  sort_order: 0,
};

type FormData = typeof EMPTY_FORM;

function toFormData(testimonial: LandingTestimonial | null | undefined): FormData {
  if (!testimonial) return EMPTY_FORM;
  return {
    author_name: testimonial.author_name,
    author_role: testimonial.author_role,
    institution_name: testimonial.institution_name,
    quote: testimonial.quote,
    avatar_url: testimonial.avatar_url ?? "",
    rating: testimonial.rating,
    status: testimonial.status,
    highlighted: testimonial.highlighted,
    sort_order: testimonial.sort_order,
  };
}

type Props = {
  testimonial?: LandingTestimonial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TestimonialEditorDialog({ testimonial, open, onOpenChange }: Props) {
  const isEdit = Boolean(testimonial?.id);
  const createMutation = useCreatePlatformTestimonialMutation();
  const updateMutation = useUpdatePlatformTestimonialMutation(testimonial?.id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  // Hydrate form every time the dialog opens (or the target testimonial changes while open)
  useEffect(() => {
    if (open) {
      setFormData(toFormData(testimonial));
    }
  }, [open, testimonial]);

  function field<K extends keyof FormData>(key: K) {
    return (value: FormData[K]) => setFormData((f) => ({ ...f, [key]: value }));
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        avatar_url: formData.avatar_url.trim() || null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success("Testimonial updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Testimonial created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save testimonial");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{isEdit ? "Edit testimonial" : "Create testimonial"}</DialogTitle>
          <DialogDescription>
            Moderate public proof points and control what appears on the landing page.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex max-h-[calc(92vh-5rem)] flex-col"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6 overflow-y-auto px-5 py-5">

            {/* ── Author profile ─────────────────────────────────── */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Author profile</h3>
                <p className="text-xs text-muted-foreground">
                  Name, role, and organization as they appear on the public site.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="t-author-name">Name</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <User className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="t-author-name"
                      value={formData.author_name}
                      onChange={(e) => field("author_name")(e.target.value)}
                      placeholder="Dr. Olamide Bakare"
                      autoComplete="off"
                      required
                    />
                  </InputGroup>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="t-author-role">Role</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <UserCog className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="t-author-role"
                      value={formData.author_role}
                      onChange={(e) => field("author_role")(e.target.value)}
                      placeholder="e.g. 300L Student / Dean of Affairs"
                      autoComplete="off"
                      required
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <Label htmlFor="t-institution">Organization</Label>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Building2 className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="t-institution"
                    value={formData.institution_name}
                    onChange={(e) => field("institution_name")(e.target.value)}
                    placeholder="e.g. Bowen University"
                    autoComplete="off"
                    required
                  />
                </InputGroup>
              </div>

              {/* Portrait URL */}
              <div className="space-y-1.5">
                <Label htmlFor="t-avatar-url">Portrait URL</Label>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Link2 className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="t-avatar-url"
                    value={formData.avatar_url}
                    onChange={(e) => field("avatar_url")(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    autoComplete="off"
                  />
                  {formData.avatar_url ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        onClick={() => field("avatar_url")("")}
                        aria-label="Remove picture"
                        title="Remove picture"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <ImageOff className="size-3.5" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : null}
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  {formData.avatar_url
                    ? "Picture set — clear it to show initials on the landing page."
                    : "No picture — the landing page will show the author's initials."}
                </p>
              </div>
            </section>

            {/* ── Review ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Public quote</h3>
                <p className="text-xs text-muted-foreground">
                  Appears verbatim on the landing page — keep it specific and believable.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-quote">Review</Label>
                <InputGroup>
                  <InputGroupAddon align="block-start" className="pt-2.5">
                    <MessageSquare className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupTextarea
                    id="t-quote"
                    value={formData.quote}
                    onChange={(e) => field("quote")(e.target.value)}
                    placeholder="Describe the outcome clearly and specifically…"
                    rows={5}
                    required
                  />
                </InputGroup>
              </div>
            </section>

            {/* ── Publishing controls ────────────────────────────── */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Publishing controls</h3>
                <p className="text-xs text-muted-foreground">
                  Set status, ordering, and landing-page visibility.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Rating */}
                <div className="space-y-1.5">
                  <Label htmlFor="t-rating">Rating (1–5)</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Star className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="t-rating"
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => field("rating")(Number(e.target.value || 5))}
                    />
                  </InputGroup>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => field("status")(v as FormData["status"])}
                  >
                    <SelectTrigger className="h-8 md:h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_review">Pending review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort order */}
                <div className="space-y-1.5">
                  <Label htmlFor="t-sort-order">Sort order</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Hash className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="t-sort-order"
                      type="number"
                      min={0}
                      value={formData.sort_order}
                      onChange={(e) => field("sort_order")(Number(e.target.value || 0))}
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Highlight toggle */}
              <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
                <Checkbox
                  id="t-highlighted"
                  checked={formData.highlighted}
                  onCheckedChange={(checked) => field("highlighted")(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="t-highlighted">Highlight on landing</Label>
                  <p className="text-xs text-muted-foreground">
                    Highlighted testimonials float to the top of the public marketing page.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="border-t px-5 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create testimonial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
