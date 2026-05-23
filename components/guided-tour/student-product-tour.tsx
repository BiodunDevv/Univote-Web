"use client";

import { useEffect, useMemo, useState } from "react";
import { driver } from "driver.js";
import { GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "univote-tour-complete-student";

export function StudentProductTour() {
  const [visible, setVisible] = useState(false);

  const steps = useMemo(
    () =>
      [
        {
          element: "[data-tour='student-sidebar']",
          popover: {
            title: "Your student workspace",
            description:
              "This area keeps your major student tools close, from elections and voting to results and profile updates.",
            side: "right" as const,
          },
        },
        {
          element: "[data-tour='student-primary-nav']",
          popover: {
            title: "Move between sections quickly",
            description:
              "Use these links to move between Home, Elections, Vote, Results, and Profile without losing your place.",
            side: "right" as const,
          },
        },
        {
          element: "[data-tour='student-topbar']",
          popover: {
            title: "Stay oriented",
            description:
              "Your top bar shows the current section and keeps notifications, support, and your profile one tap away.",
            side: "bottom" as const,
          },
        },
        {
          element: "[data-tour='student-vote-hero']",
          popover: {
            title: "Understand the election",
            description:
              "This area explains the ballot, the verification flow, and gives you a reliable route back to the vote center.",
            side: "bottom" as const,
          },
        },
        {
          element: "[data-tour='student-vote-ballot']",
          popover: {
            title: "Select candidates carefully",
            description:
              "Choose one candidate in every category, then continue through location and live identity checks.",
            side: "top" as const,
          },
        },
        {
          element: "[data-tour='student-vote-footer']",
          popover: {
            title: "Follow the guided footer",
            description:
              "This footer shows the next action, keeps progress visible, and lets you move back or forward smoothly.",
            side: "top" as const,
          },
        },
        {
          element: "[data-tour='student-mobile-nav']",
          popover: {
            title: "Mobile navigation",
            description:
              "On phones, your main student sections stay pinned at the bottom for quick one-hand access.",
            side: "top" as const,
          },
        },
      ].filter((step) => typeof document !== "undefined" && document.querySelector(step.element)),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "true") return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  const dismissTour = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(false);
  };

  const startTour = () => {
    if (steps.length === 0) {
      dismissTour();
      return;
    }

    const instance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.48,
      popoverClass: "univote-driver-popover",
      stagePadding: 10,
      doneBtnText: "Finish",
      nextBtnText: "Next",
      prevBtnText: "Back",
      onDestroyed: () => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, "true");
        }
      },
      steps,
    });

    setVisible(false);
    instance.drive();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 right-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] lg:bottom-6 lg:right-6">
      <div className="rounded-3xl border bg-background/96 p-4 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border bg-muted/60 p-2.5">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Student guide
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Learn the student portal in one quick walkthrough
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We will show you where to find elections, vote securely, view results, and manage your account.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismissTour}>
            Skip for now
          </Button>
          <Button type="button" size="sm" onClick={startTour}>
            <Sparkles className="mr-2 h-4 w-4" />
            Start tour
          </Button>
        </div>
      </div>
    </div>
  );
}
