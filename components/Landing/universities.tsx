import { Settings, Users, MapPin, CheckSquare } from "lucide-react";
import Image from "next/image";

export default function ContentSection() {
  return (
    <section id="universities" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-3xl font-medium lg:text-5xl">
          Built for Universities and Administrators
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative space-y-4">
            <p className="text-muted-foreground">
              Univote helps schools organize secure elections without paperwork.{" "}
              <span className="text-accent-foreground font-bold">
                Create sessions, upload candidates,
              </span>{" "}
              and monitor results in real time.
            </p>
            <p className="text-muted-foreground">
              Complete control and transparency. From setup to results, every
              step is streamlined for administrators.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <h3 className="text-sm font-medium">Create Elections</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Set up voting sessions, manage candidates, and define election
                  rules.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  <h3 className="text-sm font-medium">Upload Student Data</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Bulk import student records and manage permissions
                  effortlessly.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <h3 className="text-sm font-medium">Control Geofencing</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Define on-campus voting zones with precision location
                  settings.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="size-4" />
                  <h3 className="text-sm font-medium">Monitor Sessions</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Approve admins, track votes, and ensure smooth election
                  operations.
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
