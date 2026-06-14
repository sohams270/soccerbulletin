import "server-only";
import type { Article, CategorySlug } from "./types";
import { readAllArticles, readMostViewed } from "./store";
import { TAG_ARTICLES, tagArticle, tagCategory, tagTeam } from "./tags";

/**
 * Recommended revalidate intervals (seconds).
 *
 * These are *safety nets* — the time-based ceiling after which a page refreshes
 * even if no publish event fired. The primary freshness mechanism is on-demand
 * revalidation (revalidateTag / revalidatePath) fired the instant an article is
 * published, so these can be generous without serving stale content.
 *
 *  - Homepage changes on every publish                     -> 1 min
 *  - Category listings change a few times per hour         -> 5 min
 *  - Team pages change less often                          -> 10 min
 *  - An article body is effectively immutable post-publish -> 1 hour
 */
export const REVALIDATE = {
  home: 60,
  category: 300,
  team: 600,
  article: 3600,
} as const;

/**
 * Data fetching strategy
 * ----------------------
 * Pages read through `fetch()` with `next: { tags, revalidate }`. This is the
 * first-class Next.js caching primitive: the JSON response is stored in the
 * Data Cache keyed by its tags, AND the tags are recorded on the rendering
 * route's Full Route Cache entry. That second part is the key — it is what lets
 * `revalidateTag()` bust the cached HTML of *dynamic* routes (/category/[x],
 * /team/[x], /article/[x]), which `unstable_cache` tags do not reliably do.
 *
 * `BASE` points at the article API. In this project that's our own Route
 * Handlers (the stand-in CMS); in production you'd point it at your real
 * headless CMS / content API and delete the local fallback below.
 *
 * Build-time safety: during `next build` there is no server to fetch from, so
 * we read the store directly. Dynamic pages are generated on-demand at runtime
 * (see each page's generateStaticParams), so they always take the fetch path
 * and are therefore fully tag-revalidatable.
 */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const BASE =
  process.env.CMS_API_URL ??
  process.env.SITE_URL ??
  `http://localhost:${process.env.PORT ?? 3000}`;

async function load(
  pathname: string,
  tags: string[],
  revalidate: number,
  direct: () => Promise<Article[]>
): Promise<Article[]> {
  if (IS_BUILD) return direct();
  const res = await fetch(`${BASE}/api${pathname}`, { next: { tags, revalidate } });
  if (res.status === 404) return []; // missing single article -> empty, caller maps to notFound()
  if (!res.ok) throw new Error(`article API ${res.status} for ${pathname}`);
  return (await res.json()) as Article[];
}

// --- Public data API -------------------------------------------------------

export async function getLatestArticles(limit = 24): Promise<Article[]> {
  return load(
    `/articles?limit=${limit}`,
    [TAG_ARTICLES],
    REVALIDATE.home,
    async () => (await readAllArticles()).slice(0, limit)
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const list = await load(
    `/articles/${slug}`,
    [tagArticle(slug), TAG_ARTICLES],
    REVALIDATE.article,
    async () => {
      const found = (await readAllArticles()).find((a) => a.slug === slug);
      return found ? [found] : [];
    }
  );
  return list[0] ?? null;
}

export async function getArticlesByCategory(
  category: CategorySlug,
  limit = 24
): Promise<Article[]> {
  return load(
    `/articles?category=${category}&limit=${limit}`,
    [tagCategory(category), TAG_ARTICLES],
    REVALIDATE.category,
    async () =>
      (await readAllArticles()).filter((a) => a.category === category).slice(0, limit)
  );
}

/** Most-viewed articles (popular first). Drives the homepage "Editor's Pick". */
export async function getMostViewedArticles(limit = 10): Promise<Article[]> {
  return load(
    `/articles?sort=views&limit=${limit}`,
    [TAG_ARTICLES],
    REVALIDATE.home,
    async () => readMostViewed(limit)
  );
}

export async function getArticlesByTeam(team: string, limit = 24): Promise<Article[]> {
  return load(
    `/articles?team=${team}&limit=${limit}`,
    [tagTeam(team), TAG_ARTICLES],
    REVALIDATE.team,
    async () => (await readAllArticles()).filter((a) => a.team === team).slice(0, limit)
  );
}

/** Slugs of the most recent articles — handy if you choose to warm the cache. */
export async function getRecentSlugs(limit = 50): Promise<string[]> {
  return (await readAllArticles()).slice(0, limit).map((a) => a.slug);
}
