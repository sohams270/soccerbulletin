import { NextResponse } from "next/server";
import { readAllArticles } from "@/lib/store";
import { createArticle } from "@/lib/articles";
import { revalidateForArticle } from "@/lib/revalidate";
import type { CategorySlug } from "@/lib/types";

function authorized(req: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return true; // dev convenience when no secret configured
  return req.headers.get("x-api-key") === secret;
}

/**
 * GET /api/articles?category=&team=&limit=
 * The read API a decoupled CMS/front-end would consume with fetch() + tags.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as CategorySlug | null;
  const team = searchParams.get("team");
  const limit = Number(searchParams.get("limit") ?? 50);

  let articles = await readAllArticles();
  if (category) articles = articles.filter((a) => a.category === category);
  if (team) articles = articles.filter((a) => a.team === team);

  return NextResponse.json(articles.slice(0, limit));
}

/**
 * POST /api/articles  — publish a new article.
 * Persists it, then triggers targeted ISR revalidation for ONLY the affected
 * pages (article, homepage, its category, its team). No full rebuild.
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const article = await createArticle(body as Parameters<typeof createArticle>[0]);
    revalidateForArticle(article);

    return NextResponse.json(
      {
        ok: true,
        article: { slug: article.slug, title: article.title },
        revalidated: {
          paths: [
            "/",
            `/article/${article.slug}`,
            `/category/${article.category}`,
            ...(article.team ? [`/team/${article.team}`] : []),
          ],
          tags: [
            "articles",
            `article:${article.slug}`,
            `category:${article.category}`,
            ...(article.team ? [`team:${article.team}`] : []),
          ],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
