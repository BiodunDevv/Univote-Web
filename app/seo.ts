import type { Metadata } from "next";

export const SITE_URL = "https://univote.online";
export const SITE_NAME = "Univote";
export const DEFAULT_OG_IMAGE = "/hero.svg";
export const DEFAULT_TITLE = "Univote";
export const DEFAULT_DESCRIPTION =
  "Run secure, transparent campus elections with biometric identity checks, geofenced voting, live results, and tools built for universities, student unions, and institutional election teams.";

function buildAbsoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function buildPublicMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  images = [DEFAULT_OG_IMAGE],
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  images?: string[];
  keywords?: string[];
}): Metadata {
  const url = buildAbsoluteUrl(path);
  const resolvedImages = images.map((image) => buildAbsoluteUrl(image));

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: resolvedImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: resolvedImages,
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
