import { NextResponse } from "next/server";
import { incrementViews } from "@/lib/store";

/**
 * POST /api/views  { slug }
 * Bumps an article's view counter. Called once per session from the client
 * (components/ViewTracker) so the count reflects real readers rather than ISR
 * regenerations. Public + best-effort: a failure never blocks the page.
 */
export async function POST(req: Request) {
  let slug: string | undefined;
  try {
    ({ slug } = (await req.json()) as { slug?: string });
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  await incrementViews(slug);
  return NextResponse.json({ ok: true });
}
