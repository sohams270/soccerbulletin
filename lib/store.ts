import "server-only";
import type { Article } from "./types";
import { supabase } from "./supabase";

/**
 * Persistence layer backed by Supabase (Postgres).
 *
 * The rest of the app — caching, tagging, revalidation — depends only on the
 * async function signatures below, not on where the bytes live, so swapping the
 * storage backend never touches the ISR logic.
 *
 * DB columns are snake_case; the app's Article type is camelCase, so every read
 * passes through `fromRow` and every write through `toRow`.
 */

const TABLE = "articles";

interface Row {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  team: string | null;
  author: string;
  source: string;
  image_url: string;
  published_at: string;
  read_minutes: number;
  featured: boolean;
}

function fromRow(r: Row): Article {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category as Article["category"],
    team: r.team,
    author: r.author,
    source: r.source,
    imageUrl: r.image_url,
    publishedAt: r.published_at,
    readMinutes: r.read_minutes,
    featured: r.featured,
  };
}

function toRow(a: Article): Row {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    team: a.team,
    author: a.author,
    source: a.source,
    image_url: a.imageUrl,
    published_at: a.publishedAt,
    read_minutes: a.readMinutes,
    featured: a.featured,
  };
}

/** Returns every article, newest first. */
export async function readAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`supabase read failed: ${error.message}`);
  return (data as Row[]).map(fromRow);
}

export async function insertArticle(article: Article): Promise<void> {
  const { error } = await supabase()
    .from(TABLE)
    .upsert(toRow(article), { onConflict: "slug" });
  if (error) throw new Error(`supabase insert failed: ${error.message}`);
}

export async function slugExists(slug: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`supabase slug check failed: ${error.message}`);
  return data !== null;
}

/**
 * Full-text search via the `search_articles` Postgres function (weighted
 * tsvector ranking — title hits outrank body hits, ties break on recency). The
 * ranking and filtering happen in the database, so this scales to thousands of
 * rows without loading article bodies into the app.
 */
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase().rpc("search_articles", {
    q,
    lim: limit,
  });
  if (error) throw new Error(`supabase search failed: ${error.message}`);
  return (data as Row[]).map(fromRow);
}
