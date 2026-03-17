import { Suspense } from "react";
import { HeroHeader } from "@/components/Landing/header";
import ApplicationStatusClientPage from "./page-client";

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
