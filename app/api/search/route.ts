import { NextResponse } from "next/server";
import { searchArticles } from "@/lib/store";

/**
 * GET /api/search?q=&limit=
 * Live search used by the header SearchBar. Results are always current — search
 * must reflect freshly published articles immediately, so this route is dynamic.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 50);

  if (q.length < 2) return NextResponse.json([]);

  return NextResponse.json(await searchArticles(q, limit));
}
