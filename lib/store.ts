import "server-only";
import type { Article, Comment } from "./types";
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
  views?: number;
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
    views: r.views ?? 0,
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

/**
 * Most-viewed articles, popular first (ties break on recency). Drives the
 * homepage "Editor's Pick". Falls back to recency if the `views` column or
 * index isn't present yet (i.e. before the schema migration is applied).
 */
export async function readMostViewed(limit = 10): Promise<Article[]> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("views", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return (await readAllArticles()).slice(0, limit);
  return (data as Row[]).map(fromRow);
}

/** Atomically bump an article's view counter. No-op on failure. */
export async function incrementViews(slug: string): Promise<void> {
  try {
    await supabase().rpc("increment_views", { article_slug: slug });
  } catch {
    /* migration not applied yet — ignore */
  }
}

function commentFromRow(r: {
  id: number;
  article_slug: string;
  author: string;
  body: string;
  created_at: string;
}): Comment {
  return {
    id: r.id,
    articleSlug: r.article_slug,
    author: r.author,
    body: r.body,
    createdAt: r.created_at,
  };
}

/** Comments for one article, newest first. Returns [] if the table is absent. */
export async function readComments(slug: string): Promise<Comment[]> {
  const { data, error } = await supabase()
    .from("comments")
    .select("*")
    .eq("article_slug", slug)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as Parameters<typeof commentFromRow>[0][]).map(commentFromRow);
}

/** Insert a comment and return it. Throws on failure so the API can 4xx/5xx. */
export async function addComment(
  slug: string,
  author: string,
  body: string
): Promise<Comment> {
  const { data, error } = await supabase()
    .from("comments")
    .insert({ article_slug: slug, author, body })
    .select("*")
    .single();
  if (error) throw new Error(`supabase comment insert failed: ${error.message}`);
  return commentFromRow(data as Parameters<typeof commentFromRow>[0]);
}
