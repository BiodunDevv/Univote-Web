import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";

const reviews = [
  {
    name: "Student Union",
    username: "@bowensu",
    body: "Univote transformed our election process. No more paper ballots, no more disputes — just secure, transparent voting.",
    img: "https://avatar.vercel.sh/su1",
  },
  {
    name: "Faculty Staff",
    username: "@faculty_bw",
    body: "Fast, secure, and stress-free voting. The facial recognition feature ensures every vote is legitimate.",
    img: "https://avatar.vercel.sh/faculty1",
  },
  {
    name: "Chidi Okonkwo",
    username: "@chidiokonkwo",
    body: "I voted from my phone in less than 2 minutes. The whole process was incredibly smooth and secure.",
    img: "https://avatar.vercel.sh/chidi",
  },
  {
    name: "Dr. Adewale",
    username: "@dradewale",
    body: "As an administrator, managing elections has never been easier. Real-time results and zero paperwork.",
    img: "https://avatar.vercel.sh/adewale",
  },
  {
    name: "Blessing Eze",
    username: "@blessing_eze",
    body: "Finally, a voting system that works! No technical issues, no delays. Just simple and effective.",
    img: "https://avatar.vercel.sh/blessing",
  },
  {
    name: "Campus Tech Team",
    username: "@campustech",
    body: "The geofencing feature is brilliant. Only students on campus can vote, which adds an extra layer of security.",
    img: "https://avatar.vercel.sh/techteam",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

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
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
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

export function Reviews() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-balance text-3xl font-semibold lg:text-5xl">
            What People Are Saying
          </h2>
        </div>
      </div>
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
      </div>
    </section>
  );
}
