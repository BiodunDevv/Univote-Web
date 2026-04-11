import type { MetadataRoute } from "next";
import { SITE_URL } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tenant-application",
          "/application-status",
          "/students/login",
          "/students/forgot-password",
          "/students/reset-password",
        ],
        disallow: [
          "/students/home",
          "/students/sessions",
          "/students/vote",
          "/students/results",
          "/students/profile",
          "/students/support",
          "/students/notifications",
          "/dashboard/",
          "/super-admin/",
          "/portal/",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
