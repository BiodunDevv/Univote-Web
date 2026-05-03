import type { Metadata } from "next";

export const SITE_URL = "https://univote.online";
export const SITE_NAME = "Univote";
export const DEFAULT_TITLE = "Univote";
export const DEFAULT_DESCRIPTION =
  "Run secure, transparent campus elections with biometric identity checks, geofenced voting, live results, and tools built for universities, student unions, and institutional election teams.";
export const PWA_DESCRIPTION =
  "Install Univote for a faster student sign-in and voting experience.";
export const PWA_START_URL = "/students/login";
export const PWA_SCOPE = "/students/";
export const PWA_MANIFEST_PATH = "/manifest.json";
export const PWA_ICON = "/pwa-icon.svg";
export const PWA_APPLE_ICON = "/pwa-icon-180.png";
export const PWA_BACKGROUND_COLOR = "#0f172a";
export const PWA_THEME_COLOR = "#0f172a";
export const PWA_APPLE_STATUS_BAR_STYLE = "default";

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
