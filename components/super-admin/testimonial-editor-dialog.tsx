"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) {
      setFormData(
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
          : EMPTY_FORM,
      );
    }
  }, [open, testimonial]);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={testimonial ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{testimonial ? "Edit testimonial" : "Create testimonial"}</DialogTitle>
          <DialogDescription>
            Moderate public proof points and control what appears on the marketing site.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
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

          <div className="grid gap-4 md:grid-cols-2">
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
                placeholder="Bowen University Demo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial-avatar-url">Avatar URL</Label>
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
              rows={5}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_180px_180px_1fr]">
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
            <div className="flex items-end gap-3 rounded-xl border border-dashed px-4 py-3">
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
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {testimonial ? "Save changes" : "Create testimonial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
