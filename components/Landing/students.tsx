import { CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";

export default function ContentSection() {
  return (
    <section id="students" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-3xl font-medium lg:text-5xl">
          Designed for Students
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mt-6 sm:mt-0 order-2 sm:order-1">
            <div className="bg-linear-to-b aspect-square sm:aspect-4/3 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700 overflow-hidden">
              <Image
                src="https://media.istockphoto.com/id/2181480843/photo/the-smartphone-screen-shows-a-vote-application-with-green-check-mark-and-red-cross-icon.webp?a=1&b=1&s=612x612&w=0&k=20&c=l4fXd8cZxO9v908BIJtP4GD-lbP1MOXOzVtZLDw41c8="
                className="rounded-[15px] object-cover w-full h-full"
                alt="Students voting on campus"
                width={800}
                height={600}
              />
            </div>
          </div>
          <div className="relative space-y-4 order-1 sm:order-2">
            <p className="text-muted-foreground">
              Vote easily from your phone or laptop during active elections.{" "}
              <span className="text-accent-foreground font-bold">
                No manual registration
              </span>{" "}
              — just face verification and click vote. Secure, fast, and
              reliable.
            </p>
            <p className="text-muted-foreground">
              Univote makes campus voting simple and accessible for everyone.
              Your voice matters, and we make it easy to be heard.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  <h3 className="text-sm font-medium">No Paperwork</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Fully digital experience. Vote from anywhere on campus in
                  seconds.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <h3 className="text-sm font-medium">Instant Verification</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Face recognition ensures your vote is valid and secure every
                  time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
