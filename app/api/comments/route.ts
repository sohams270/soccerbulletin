import { NextResponse } from "next/server";
import { readComments, addComment } from "@/lib/store";

/** GET /api/comments?slug=...  — list comments for an article (newest first). */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  return NextResponse.json(await readComments(slug));
}

/** POST /api/comments  { slug, author, body }  — add a comment. */
export async function POST(req: Request) {
  let payload: { slug?: string; author?: string; body?: string };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const slug = payload.slug?.trim();
  const author = payload.author?.trim();
  const body = payload.body?.trim();
  if (!slug || !author || !body) {
    return NextResponse.json(
      { error: "slug, author and body are required" },
      { status: 400 }
    );
  }
  if (author.length > 60 || body.length > 2000) {
    return NextResponse.json({ error: "input too long" }, { status: 400 });
  }

  try {
    const comment = await addComment(slug, author, body);
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to add comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
