import type { LandingTestimonial } from "@/types/landing";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";

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
  const reviews: ReviewItem[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.author_name,
    username: toUsername(testimonial.author_name),
    body: testimonial.quote,
    img:
      testimonial.avatar_url ||
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&crop=faces",
  }));
  const { firstRow, secondRow } = splitRows(reviews);

  return (
    <section id="stories" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-2 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-semibold lg:text-5xl">
            What People Are Saying
          </h2>
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
