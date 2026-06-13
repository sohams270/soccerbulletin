# SoccerBulletin

Global football news site built with the Next.js App Router. Article pages are
statically generated and served from the CDN, then refreshed with **on-demand
Incremental Static Regeneration** — publishing an article revalidates only the
pages it touches (the article, the homepage, its category, and its team), never
a full rebuild. Data lives in **Supabase** (Postgres), with weighted full-text
search.

## Stack

- Next.js 15 (App Router, React 19, TypeScript)
- Supabase Postgres (data + full-text search)
- ISR via `fetch()` + cache tags and `revalidateTag` / `revalidatePath`

## How ISR works here

Pages read through `fetch()` with `next: { tags, revalidate }` ([lib/data.ts](lib/data.ts)).
The tags are recorded on each route's cache entry, so `revalidateTag()` can bust
the cached HTML of dynamic routes. Dynamic pages use `generateStaticParams() = []`
+ `dynamicParams = true`, so they're generated on-demand and fully revalidatable.

Recommended revalidate intervals (time-based safety nets; on-demand is primary):

| Page      | Interval |
|-----------|----------|
| Homepage  | 60s      |
| Category  | 300s     |
| Team      | 600s     |
| Article   | 3600s    |

Tag vocabulary lives in [lib/tags.ts](lib/tags.ts); invalidation in
[lib/revalidate.ts](lib/revalidate.ts).

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and fill in:

| Variable                     | Purpose                                                        |
|------------------------------|---------------------------------------------------------------|
| `SUPABASE_URL`               | Supabase project URL (Settings → API)                         |
| `SUPABASE_SERVICE_ROLE_KEY`  | Service-role key — server-only, bypasses RLS                   |
| `SITE_URL`                   | Public base URL; used by the ISR `fetch()+tags` layer + sitemap |
| `REVALIDATE_SECRET`          | Shared secret (`x-api-key`) protecting the publish/revalidate APIs |

## Local development

```bash
npm install
cp .env.example .env.local        # then fill in your Supabase keys
# In the Supabase SQL editor, run supabase/schema.sql first.
npm run import-seed               # loads data/articles.json into Supabase
npm run dev
```

> The data layer requires Supabase — there is no local file fallback. `npm run dev`
> needs `.env.local` with valid keys.

## Database setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run all of [supabase/schema.sql](supabase/schema.sql). This
   creates the `articles` table, a weighted `tsvector` index, the
   `search_articles(q, lim)` ranking function, and enables RLS.
3. **Settings → API** → copy the **Project URL** and **service_role** key.
4. Seed existing content: `npm run import-seed`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo
   (Next.js is auto-detected; no `vercel.json` needed).
3. Add the four environment variables above for **Production** and **Preview**.
   Set `SITE_URL` to your Vercel domain.
4. Deploy. If you used a generated domain, update `SITE_URL` to match and redeploy.

## Publishing articles

`POST /api/articles` with header `x-api-key: <REVALIDATE_SECRET>` and a JSON body:

```json
{
  "title": "…",
  "excerpt": "…",
  "content": "…",
  "category": "premier-league",
  "team": "arsenal"
}
```

It writes to Supabase and fires targeted ISR revalidation for only the affected
pages. There's also `POST /api/revalidate` for CMS-style webhook revalidation by
`slug`, `tags`, or `paths`.
