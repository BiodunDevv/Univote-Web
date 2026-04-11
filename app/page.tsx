import type { Metadata } from "next";
import { HomePageClient } from "@/components/Landing/home-page-client";
import { buildPublicMetadata, SITE_NAME, SITE_URL } from "./seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Univote",
  description:
    "Univote is the product of my final-year project journey, and it reflects both my technical growth and my passion for building systems that solve real campus problems. I created it to modernize university elections by replacing stressful, manual processes with a secure digital experience students and administrators can trust. The platform combines biometric verification to confirm voter identity, geofencing to protect location-based voting rules, transparent vote flows that make each step clear, and real-time result publishing so campuses can see outcomes quickly and confidently. While building it, I focused on security, usability, and reliability, because I wanted more than a prototype. I wanted a system that could genuinely be deployed and make election management easier for institutions. From architecture decisions to user experience details, every part was intentionally designed to protect vote integrity and improve participation. Univote is not just my final-year submission; it is a project I am genuinely proud of and excited to keep improving.",
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
          "Univote is the product of my final-year project journey, and it reflects both my technical growth and my passion for building systems that solve real campus problems. I created it to modernize university elections by replacing stressful, manual processes with a secure digital experience students and administrators can trust. The platform combines biometric verification to confirm voter identity, geofencing to protect location-based voting rules, transparent vote flows that make each step clear, and real-time result publishing so campuses can see outcomes quickly and confidently. While building it, I focused on security, usability, and reliability, because I wanted more than a prototype. I wanted a system that could genuinely be deployed and make election management easier for institutions. From architecture decisions to user experience details, every part was intentionally designed to protect vote integrity and improve participation. Univote is not just my final-year submission; it is a project I am genuinely proud of and excited to keep improving.",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "A campus election software platform I built as my final-year project to help universities run fair elections with student identity checks, geofencing controls, and real-time election operations.",
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
