import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroHeader } from "@/components/Landing/header";
import ApplicationStatusClientPage from "./page-client";
import { buildPublicMetadata } from "../seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Track University Workspace Application Status",
  description:
    "Check the live status of your Univote university workspace application and review approval updates from the onboarding team.",
  path: "/application-status",
  keywords: [
    "application status",
    "university workspace status",
    "campus voting onboarding status",
  ],
});

export default function ApplicationStatusPage() {
  return (
    <>
      <HeroHeader />
      <Suspense fallback={null}>
        <ApplicationStatusClientPage />
      </Suspense>
    </>
  );
}
