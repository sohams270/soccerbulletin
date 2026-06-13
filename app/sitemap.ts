import type { MetadataRoute } from "next";
import { readAllArticles } from "@/lib/store";
import { CATEGORIES, TEAMS } from "@/lib/taxonomy";

const BASE = process.env.SITE_URL ?? "https://soccerbulletin.example";

// Regenerated on the same cadence as the homepage so newly published articles
// appear in the sitemap quickly without a rebuild.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await readAllArticles();

  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/category/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...TEAMS.map((t) => ({
      url: `${BASE}/team/${t.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...articles.map((a) => ({
      url: `${BASE}/article/${a.slug}`,
      lastModified: a.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
