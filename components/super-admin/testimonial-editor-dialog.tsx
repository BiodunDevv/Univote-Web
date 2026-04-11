"use client";

import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

type Props = {
  triggerLabel: string;
  testimonial?: LandingTestimonial | null;
};

export function TestimonialEditorDialog({ triggerLabel, testimonial }: Props) {
  const createMutation = useCreatePlatformTestimonialMutation();
  const updateMutation = useUpdatePlatformTestimonialMutation(testimonial?.id || "");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const hydrateForm = () =>
    testimonial
      ? {
          author_name: testimonial.author_name,
          author_role: testimonial.author_role,
          institution_name: testimonial.institution_name,
          quote: testimonial.quote,
          avatar_url: testimonial.avatar_url || "",
          rating: testimonial.rating,
          status: testimonial.status,
          highlighted: testimonial.highlighted,
          sort_order: testimonial.sort_order,
        }
      : EMPTY_FORM;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormData(hydrateForm());
      return;
    }

    setFormData(EMPTY_FORM);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload = {
        ...formData,
        avatar_url: formData.avatar_url || undefined,
      };

      if (testimonial?.id) {
        await updateMutation.mutateAsync(payload);
        toast.success("Testimonial updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Testimonial created");
      }

      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save testimonial");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={testimonial ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle>{testimonial ? "Edit testimonial" : "Create testimonial"}</DialogTitle>
          <DialogDescription>
            Moderate public proof points and control what appears on the marketing site.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[calc(92vh-4.5rem)] flex-col" onSubmit={handleSubmit}>
          <div className="space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Author profile</h3>
                <p className="text-xs text-muted-foreground">
                  Capture the name, role, and institution exactly as it should appear on the public site.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-author-name">Author name</Label>
                  <Input
                    id="testimonial-author-name"
                    value={formData.author_name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        author_name: event.target.value,
                      }))
                    }
                    placeholder="Dr. Olamide Bakare"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testimonial-author-role">Author role</Label>
                  <Input
                    id="testimonial-author-role"
                    value={formData.author_role}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        author_role: event.target.value,
                      }))
                    }
                    placeholder="Dean of Academic Affairs"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-institution-name">Institution</Label>
                  <Input
                    id="testimonial-institution-name"
                    value={formData.institution_name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        institution_name: event.target.value,
                      }))
                    }
                    placeholder="Bowen University"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testimonial-avatar-url">Portrait URL</Label>
                  <Input
                    id="testimonial-avatar-url"
                    value={formData.avatar_url}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        avatar_url: event.target.value,
                      }))
                    }
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Public quote</h3>
                <p className="text-xs text-muted-foreground">
                  Keep the quote specific, believable, and ready for the landing page without extra editing.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial-quote">Quote</Label>
                <Textarea
                  id="testimonial-quote"
                  value={formData.quote}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      quote: event.target.value,
                    }))
                  }
                  placeholder="Describe the product outcome clearly and specifically."
                  rows={6}
                  required
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Publishing controls</h3>
                <p className="text-xs text-muted-foreground">
                  Set review status, ordering, and whether this testimonial should float near the top of the landing feed.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-rating">Rating</Label>
                  <Input
                    id="testimonial-rating"
                    type="number"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        rating: Number(event.target.value || 5),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        status: value as typeof current.status,
                      }))
                    }
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="testimonial-sort-order">Sort order</Label>
                  <Input
                    id="testimonial-sort-order"
                    type="number"
                    min={0}
                    value={formData.sort_order}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        sort_order: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
                <Checkbox
                  id="testimonial-highlighted"
                  checked={formData.highlighted}
                  onCheckedChange={(checked) =>
                    setFormData((current) => ({
                      ...current,
                      highlighted: checked === true,
                    }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="testimonial-highlighted">Highlight on landing</Label>
                  <p className="text-xs text-muted-foreground">
                    Highlighted testimonials float to the top of the public marketing page.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="border-t px-4 py-4 sm:px-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {testimonial ? "Save changes" : "Create testimonial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
