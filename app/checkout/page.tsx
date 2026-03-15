import { Suspense } from "react";
import CheckoutClientPage from "./page-client";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClientPage />
    </Suspense>
  );
}
