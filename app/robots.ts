import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "https://soccerbulletin.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
