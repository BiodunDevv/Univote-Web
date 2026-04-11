import type { LandingTestimonial } from "@/types/landing";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitTestimonialMutation } from "@/lib/queries/public";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewItem = {
  id: string;
  name: string;
  username: string;
  body: string;
  img: string;
};

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

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="#e7eefb" />
      <text x="50%" y="54%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#193b6b">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        "border-gray-950/10 bg-gray-950/10 hover:bg-gray-950/5",
        "dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15",
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
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

function splitRows(reviews: ReviewItem[]) {
  if (reviews.length <= 1) {
    return { firstRow: reviews, secondRow: reviews };
  }

  const midpoint = Math.ceil(reviews.length / 2);
  return {
    firstRow: reviews.slice(0, midpoint),
    secondRow: reviews.slice(midpoint),
  };
}

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: LandingTestimonial[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    author_name: "",
    author_role: "",
    institution_name: "",
    quote: "",
  });
  const submitMutation = useSubmitTestimonialMutation();
  const reviews: ReviewItem[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.author_name,
    username: toUsername(testimonial.author_name),
    body: testimonial.quote,
    img: testimonial.avatar_url || buildFallbackAvatar(testimonial.author_name),
  }));
  const { firstRow, secondRow } = splitRows(reviews);

  return (
    <section id="stories" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-2 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-semibold lg:text-5xl">
            What People Are Saying
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Published stories are moderated by the platform team. You can submit your own review for consideration.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-5">
                Submit a testimonial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a testimonial</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    await submitMutation.mutateAsync(form);
                    toast.success("Testimonial submitted for review");
                    setOpen(false);
                    setForm({
                      author_name: "",
                      author_role: "",
                      institution_name: "",
                      quote: "",
                    });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to submit testimonial");
                  }
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.author_name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, author_name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={form.author_role}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, author_role: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input
                    value={form.institution_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, institution_name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review</Label>
                  <Textarea
                    rows={5}
                    value={form.quote}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quote: event.target.value }))
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Submit for review"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((review) => (
            <ReviewCard
              key={review.id}
              img={review.img}
              name={review.name}
              username={review.username}
              body={review.body}
            />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
          {secondRow.map((review) => (
            <ReviewCard
              key={`${review.id}-reverse`}
              img={review.img}
              name={review.name}
              username={review.username}
              body={review.body}
            />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background" />
      </div>

      <div className="mx-auto mt-5 max-w-5xl px-2 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">
          Every testimonial shown here is published from the platform moderation
          queue, not a static hardcoded list.
        </p>
      </div>
    </section>
  );
}
