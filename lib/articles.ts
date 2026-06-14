import "server-only";
import type { Article, NewArticleInput } from "./types";
import { insertArticle, slugExists } from "./store";
import { getCategory, getTeam } from "./taxonomy";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await slugExists(slug)) slug = `${base}-${n++}`;
  return slug;
}

/**
 * Validates input, persists the article, and returns it. Revalidation is the
 * caller's job (route handler / server action) so that revalidateTag/Path run
 * inside a request scope.
 */
export async function createArticle(input: NewArticleInput): Promise<Article> {
  if (!input.title?.trim()) throw new Error("title is required");
  if (!input.excerpt?.trim()) throw new Error("excerpt is required");
  if (!input.content?.trim()) throw new Error("content is required");
  if (!getCategory(input.category)) throw new Error(`unknown category: ${input.category}`);
  if (input.team && !getTeam(input.team)) throw new Error(`unknown team: ${input.team}`);

  const now = new Date().toISOString();
  const slug = await uniqueSlug(slugify(input.title));

  const article: Article = {
    id: `a-${Date.now()}`,
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    category: input.category,
    team: input.team ?? null,
    author: input.author?.trim() || "SoccerBulletin Staff",
    source: input.source?.trim() || "SoccerBulletin",
    imageUrl: input.imageUrl?.trim() || `https://picsum.photos/seed/${slug}/1200/675`,
    publishedAt: now,
    readMinutes: input.readMinutes ?? Math.max(2, Math.round(input.content.split(/\s+/).length / 200)),
    featured: input.featured ?? false,
    views: 0,
  };

  await insertArticle(article);
  return article;
}
