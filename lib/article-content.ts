/**
 * Article body parser.
 *
 * Bodies are stored as plain text with blank-line-separated paragraphs. Lines
 * beginning with `## ` or `### ` are treated as section headings — these get a
 * stable slug `id` so the Table of Contents can deep-link to them and the
 * scroll-spy can highlight the active section.
 */

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph"; text: string };

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function parseContent(content: string): {
  blocks: Block[];
  toc: TocEntry[];
} {
  const blocks: Block[] = [];
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();

  for (const raw of content.split(/\n{2,}/)) {
    const para = raw.trim();
    if (!para) continue;

    const m = /^(#{2,3})\s+(.*)$/.exec(para);
    if (m) {
      const level = (m[1].length === 2 ? 2 : 3) as 2 | 3;
      const text = m[2].trim();
      let id = slugify(text);
      // Guard against duplicate heading slugs within one article.
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;
      blocks.push({ type: "heading", level, text, id });
      toc.push({ id, text, level });
    } else {
      blocks.push({ type: "paragraph", text: para });
    }
  }

  return { blocks, toc };
}
