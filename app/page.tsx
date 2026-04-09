import type { Metadata } from "next";
import { HomePageClient } from "@/components/Landing/home-page-client";
import { buildPublicMetadata, SITE_NAME, SITE_URL } from "./seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Smart Campus Voting Platform",
  description:
    "Launch secure university elections with biometric verification, geofencing, transparent vote flows, and real-time campus result publishing.",
  path: "/",
  keywords: [
    "smart campus voting platform",
    "university election software",
    "student voting portal",
    "biometric university elections",
    "campus voting system",
  ],
});

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description:
          "Secure university voting platform for biometric campus elections and transparent result publishing.",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "Campus election software for universities with student identity checks, geofencing, and real-time election operations.",
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/Darklogo.png`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageClient />
    </>
  );
}
