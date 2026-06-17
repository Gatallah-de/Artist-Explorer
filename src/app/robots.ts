// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/static/"], // prevent crawling internals
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
