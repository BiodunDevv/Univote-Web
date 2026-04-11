import type { Metadata } from "next";

export const SITE_URL = "https://univote.online";
export const SITE_NAME = "Univote";
export const DEFAULT_TITLE = "Univote";
export const DEFAULT_DESCRIPTION =
  "Run secure, transparent campus elections with biometric identity checks, geofenced voting, live results, and tools built for universities, student unions, and institutional election teams.";

export function buildPublicMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
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
