// One-off importer: loads data/articles.json into the Supabase `articles` table.
//
// Usage (after running supabase/schema.sql):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-seed.mjs
// or put those in .env.local and run:  node --env-file=.env.local scripts/import-seed.mjs

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const seed = JSON.parse(
  await readFile(new URL("../data/articles.json", import.meta.url), "utf8")
);

const rows = seed.map((a) => ({
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
}));

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error } = await supabase.from("articles").upsert(rows, { onConflict: "slug" });
if (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
}
console.log(`Imported ${rows.length} articles.`);
