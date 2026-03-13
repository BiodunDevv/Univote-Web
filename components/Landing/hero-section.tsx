"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { HeroIllustration } from "../HeroIllustration";

export function HeroSection() {
  const { token } = useAuthStore();
  const { token: studentToken } = useStudentAuthStore();
  const primaryHref = token
    ? "/dashboard"
    : studentToken
      ? "/students/home"
      : "/students/login";
  const primaryLabel = token
    ? "Open Admin Dashboard"
    : studentToken
      ? "Open Student Portal"
      : "Student Login";

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto sm:mt-12">
          {/* Left Content */}
          <div className="w-full lg:max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.1] mb-4 sm:mb-6">
              Revolutionize Campus Elections with Smart Digital Voting
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Secure, transparent, and efficient digital elections tailored for
              universities. Empower your campus with cutting-edge voting
              technology.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-xl px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base bg-foreground text-background hover:bg-foreground/90 font-medium transition-all duration-200 hover:scale-[1.02]"
                asChild
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {!token && !studentToken ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-medium"
                  asChild
                >
                  <Link href="/auth/signin">Admin Login</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Right Content - Hero Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
              <HeroIllustration />
            </div>
          </div>
        </div>

        {/* Features Section */}
      </div>
    </section>
  );
}
