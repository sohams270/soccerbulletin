import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { readAllArticles } from "@/lib/store";
import { revalidateForArticle } from "@/lib/revalidate";

function authorized(req: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return true;
  return req.headers.get("x-api-key") === secret;
}

/**
 * Manual / webhook revalidation endpoint. Call this from a CMS "publish" or
 * "update" webhook so editorial changes go live without a deploy.
 *
 * Body options:
 *   { "slug": "..." }            -> revalidate everything that article touches
 *   { "tags": ["category:..."] } -> revalidate specific tags
 *   { "paths": ["/"] }           -> revalidate specific paths
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    tags?: string[];
    paths?: string[];
  };

  const done = { tags: [] as string[], paths: [] as string[] };

  if (body.slug) {
    const article = (await readAllArticles()).find((a) => a.slug === body.slug);
    if (!article) {
      return NextResponse.json({ error: "slug not found" }, { status: 404 });
    }
    revalidateForArticle(article);
    done.paths.push("/", `/article/${article.slug}`, `/category/${article.category}`);
    if (article.team) done.paths.push(`/team/${article.team}`);
  }

  for (const tag of body.tags ?? []) {
    revalidateTag(tag);
    done.tags.push(tag);
  }
  for (const path of body.paths ?? []) {
    revalidatePath(path);
    done.paths.push(path);
  }

  return NextResponse.json({ ok: true, revalidated: done, now: Date.now() });
}
