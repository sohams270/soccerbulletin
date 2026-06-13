import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import type { Article } from "./types";
import { TAG_ARTICLES, tagArticle, tagCategory, tagTeam } from "./tags";

/**
 * The heart of the ISR strategy: given one published/edited article, invalidate
 * EXACTLY the pages that contain it — and nothing else.
 *
 * Two complementary tools, used together:
 *
 *  - revalidateTag(...) busts the *data* caches (unstable_cache / fetch cache)
 *    that any page reused, no matter which route rendered it.
 *  - revalidatePath(...) busts the *rendered* full-route cache for the specific
 *    URLs we know are affected.
 *
 * What is touched for a single article:
 *    /                       (homepage "Latest News")
 *    /article/<slug>         (the article itself)
 *    /category/<category>    (its league/section)
 *    /team/<team>            (its team, if any)
 *
 * Thousands of other article/category/team pages are left untouched and keep
 * serving from the CDN. No full-site rebuild ever happens.
 */
export function revalidateForArticle(article: Pick<Article, "slug" | "category" | "team">) {
  // 1. Data-cache tags (shared across every render that read this data).
  revalidateTag(TAG_ARTICLES); // homepage + any "latest" list
  revalidateTag(tagArticle(article.slug)); // the article's own cached read
  revalidateTag(tagCategory(article.category)); // its category listing
  if (article.team) revalidateTag(tagTeam(article.team)); // its team listing

  // 2. Rendered-route cache for the exact affected URLs.
  revalidatePath("/");
  revalidatePath(`/article/${article.slug}`);
  revalidatePath(`/category/${article.category}`);
  if (article.team) revalidatePath(`/team/${article.team}`);

  // 3. Keep the sitemap fresh so the new URL is discoverable immediately (SEO).
  revalidatePath("/sitemap.xml");
}
