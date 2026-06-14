-- SoccerBulletin — Supabase schema.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).

create table if not exists public.articles (
  id           text primary key,
  slug         text unique not null,
  title        text not null,
  excerpt      text not null,
  content      text not null,
  category     text not null,
  team         text,
  author       text not null,
  source       text not null,
  image_url    text not null,
  published_at timestamptz not null default now(),
  read_minutes int  not null,
  featured     bool not null default false
);

-- Popularity counter (drives the homepage "Editor's Pick" = most viewed).
alter table public.articles
  add column if not exists views integer not null default 0;

create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_category_idx  on public.articles (category);
create index if not exists articles_team_idx      on public.articles (team);
create index if not exists articles_views_idx     on public.articles (views desc);

-- Atomic, race-free view increment. Called from POST /api/views on each read.
create or replace function public.increment_views(article_slug text)
returns void
language sql
volatile
as $$
  update public.articles set views = views + 1 where slug = article_slug;
$$;

-- Reader comments for the individual article pages.
create table if not exists public.comments (
  id           bigint generated always as identity primary key,
  article_slug text not null references public.articles(slug) on delete cascade,
  author       text not null,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists comments_article_idx
  on public.comments (article_slug, created_at desc);

alter table public.comments enable row level security;

-- Weighted full-text vector. Weights map to the old in-JS scoring:
--   A = title (highest), B = excerpt + team, C = category, D = content + author.
alter table public.articles
  add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')),   'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')),  'B') ||
    setweight(to_tsvector('english', coalesce(replace(team, '-', ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(replace(category, '-', ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(content, '')),  'D') ||
    setweight(to_tsvector('english', coalesce(author, '')),   'D')
  ) stored;

create index if not exists articles_fts_idx on public.articles using gin (fts);

-- Ranked search used by lib/store.ts -> supabase.rpc('search_articles', ...).
-- websearch_to_tsquery gives sensible AND/phrase semantics for user input.
create or replace function public.search_articles(q text, lim int default 20)
returns setof public.articles
language sql
stable
as $$
  select *
  from public.articles
  where fts @@ websearch_to_tsquery('english', q)
  order by ts_rank(fts, websearch_to_tsquery('english', q)) desc,
           published_at desc
  limit lim;
$$;

-- Row Level Security: the app uses the service-role key (which bypasses RLS), so
-- enabling RLS with no public policies keeps the anon key from reading/writing.
alter table public.articles enable row level security;
