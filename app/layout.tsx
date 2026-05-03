import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { StudentPwaBootstrap } from "@/components/students/student-pwa-bootstrap";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  PWA_APPLE_STATUS_BAR_STYLE,
  PWA_APPLE_ICON,
  PWA_ICON,
  PWA_MANIFEST_PATH,
  PWA_THEME_COLOR,
  SITE_NAME,
  SITE_URL,
} from "./seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  icons: {
    icon: [{ url: PWA_ICON, type: "image/svg+xml" }],
    shortcut: [PWA_ICON],
    apple: [{ url: PWA_APPLE_ICON, type: "image/png", sizes: "180x180" }],
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: PWA_MANIFEST_PATH,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: PWA_APPLE_STATUS_BAR_STYLE,
  },
  keywords: [
    "university voting platform",
    "campus election software",
    "student election system",
    "digital voting for universities",
    "biometric voting platform",
    "secure campus elections",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <StudentPwaBootstrap />
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster position="top-center" />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
