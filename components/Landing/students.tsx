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
          <div className="relative space-y-4">
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
          <div className="relative mt-6 sm:mt-0">
            <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                src="/exercice-dark.png"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1206}
                height={612}
              />
              <Image
                src="/exercice.png"
                className="rounded-[15px] shadow dark:hidden"
                alt="payments illustration light"
                width={1206}
                height={612}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
