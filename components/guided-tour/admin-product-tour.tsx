"use client";

import { useEffect } from "react";
import { driver } from "driver.js";

type AdminProductTourProps = {
  scope: "tenant" | "super-admin";
};

const TOUR_KEYS = {
  tenant: "univote-tour-complete-tenant-admin",
  "super-admin": "univote-tour-complete-super-admin",
} as const;

export function AdminProductTour({ scope }: AdminProductTourProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = TOUR_KEYS[scope];
    if (window.localStorage.getItem(storageKey) === "true") {
      return;
    }

    const steps = [
      ...(scope === "tenant"
        ? [
            {
              element: "[data-tour='tenant-guide-settings']",
              popover: {
                title: "Start with settings",
                description:
                  "Review participant labels, identity rules, structure, and workspace defaults here before inviting more people in.",
                side: "bottom" as const,
              },
            },
            {
              element: "[data-tour='tenant-guide-application']",
              popover: {
                title: "Review application status",
                description:
                  "Open the application panel to track moderation status, review notes, and activation milestones.",
                side: "bottom" as const,
              },
            },
            {
              element: "[data-tour='tenant-guide-sessions']",
              popover: {
                title: "Create your first election",
                description:
                  "When your workspace settings are ready, move here to create the first election or ballot election.",
                side: "bottom" as const,
              },
            },
            {
              element: "[data-tour='tenant-guide-structure']",
              popover: {
                title: "Structure is optional",
                description:
                  "If your organization uses colleges or departments, configure them here. Flat organizations can skip this completely.",
                side: "bottom" as const,
              },
            },
          ]
        : []),
      {
        element: "[data-tour='admin-sidebar']",
        popover: {
          title: "Primary navigation",
          description:
            "Your sidebar is the fastest way to move through participants, elections, settings, and the rest of your workspace.",
          side: "right" as const,
        },
      },
      {
        element: "[data-tour='admin-header-tabs']",
        popover: {
          title: "Top tabs",
          description:
            "These tabs keep the major work areas one tap away, without opening the full sidebar every time.",
          side: "bottom" as const,
        },
      },
      {
        element: "[data-tour='admin-workspace-switcher']",
        popover: {
          title: "Workspace switcher",
          description:
            scope === "tenant"
              ? "Switch between organisations here when your account belongs to more than one workspace."
              : "This area changes based on the current platform section and keeps key admin actions close.",
          side: "bottom" as const,
        },
      },
      {
        element: "[data-tour='admin-notifications']",
        popover: {
          title: "Notifications and actions",
          description:
            "Use this area to stay on top of alerts, support activity, and new operational events.",
          side: "left" as const,
        },
      },
    ].filter((step) => document.querySelector(step.element));

    if (steps.length === 0) {
      return;
    }

    const instance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.48,
      popoverClass: "univote-driver-popover",
      stagePadding: 10,
      onDestroyed: () => {
        window.localStorage.setItem(storageKey, "true");
      },
      steps,
    });

    const timer = window.setTimeout(() => {
      instance.drive();
    }, 600);

    return () => {
      window.clearTimeout(timer);
      instance.destroy();
    };
  }, [scope]);

  return null;
}
