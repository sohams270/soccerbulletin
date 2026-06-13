import { NextResponse } from "next/server";
import { readAllArticles } from "@/lib/store";

// GET /api/articles/<slug> — single article (returned as a 1-item array so the
// data layer can use one parsing path for list and detail responses).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = (await readAllArticles()).find((a) => a.slug === slug);
  if (!article) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json([article]);
}
