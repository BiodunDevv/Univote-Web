import { Suspense } from "react";
import ApplicationStatusClientPage from "./page-client";

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationStatusClientPage />
    </Suspense>
  );
}
