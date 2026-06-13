import Link from "next/link";
import { getArticlesByCategory, getLatestArticles, REVALIDATE } from "@/lib/data";
import { CATEGORIES, TEAMS } from "@/lib/taxonomy";
import { ArticleCard, SideItem } from "@/components/Cards";
import { timeAgo } from "@/lib/format";

// Homepage = "Latest News": aggregates every category. Statically generated,
// served from the CDN, and refreshed at most once a minute or instantly when a
// new article is published (revalidateTag("articles") / revalidatePath("/")).
export const revalidate = 60; // REVALIDATE.home

// Categories that map to a national flag (file: /public/flags/<slug>.svg).
const FLAG_SLUGS = new Set([
  "premier-league",
  "la-liga",
  "bundesliga",
  "ligue-1",
  "saudi-pro-league",
]);

export default async function HomePage() {
  const [latest, ...categoryArticles] = await Promise.all([
    getLatestArticles(20),
    ...CATEGORIES.map((c) => getArticlesByCategory(c.slug, 4)),
  ]);
  const strips = CATEGORIES.map((category, i) => ({
    category,
    articles: categoryArticles[i],
  }));

  const lead = latest.find((a) => a.featured) ?? latest[0];
  const rest = latest.filter((a) => a.slug !== lead?.slug);
  const latestGrid = rest.slice(0, 8);
  const mustRead = rest.slice(8, 13);
  const editorPick = rest[13] ?? rest[0];

  return (
    <div className="container">
      <section className="welcome">
        <div className="eyebrow">Global football, one place</div>
        <h1>
          Your Front Row Seat to <em>World Football</em>
        </h1>
      </section>

      <div className="layout">
        {/* Main column */}
        <div>
          {lead && (
            <article className="lead">
              <Link href={`/article/${lead.slug}`} className="lead-img">
                <img src={lead.imageUrl} alt={lead.title} />
              </Link>
              <div>
                <div className="byline">
                  <span className="avatar">{lead.source.slice(0, 2)}</span>
                  <span className="meta">
                    {lead.source}
                    <span className="dot" />
                    {timeAgo(lead.publishedAt)}
                  </span>
                </div>
                <h2>
                  <Link href={`/article/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p>{lead.excerpt}</p>
                <span className="chip">{lead.category.replace(/-/g, " ")}</span>
              </div>
            </article>
          )}

          <div className="section-head">
            <h2>Latest News</h2>
            <Link href="/category/international" className="see-all">
              See all →
            </Link>
          </div>
          <div className="grid-4">
            {latestGrid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>

          <div className="section-head">
            <h2>Follow Clubs</h2>
          </div>
          <div className="team-rail">
            {TEAMS.map((t) => (
              <Link key={t.slug} href={`/team/${t.slug}`} className="team-pill">
                <span className="team-crest" aria-hidden>
                  <img src={`/logos/${t.slug}.png`} alt="" loading="lazy" />
                </span>
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="side-block">
            <div className="section-head">
              <h2>Must Read</h2>
              <span className="see-all">See all</span>
            </div>
            {mustRead.map((a) => (
              <SideItem key={a.id} article={a} />
            ))}
          </div>

          {editorPick && (
            <div className="side-block">
              <div className="section-head">
                <h2>Editor&apos;s Pick</h2>
              </div>
              <Link href={`/article/${editorPick.slug}`} className="editor-pick">
                <img src={editorPick.imageUrl} alt={editorPick.title} />
                <div className="overlay">
                  <span className="chip" style={{ color: "#fff" }}>
                    {editorPick.category.replace(/-/g, " ")}
                  </span>
                  <h3>{editorPick.title}</h3>
                </div>
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Category strips */}
      {strips.map(({ category, articles }) => (
        <CategoryStrip
          key={category.slug}
          title={category.name}
          slug={category.slug}
          articles={articles}
        />
      ))}
    </div>
  );
}

function CategoryStrip({
  title,
  slug,
  articles,
}: {
  title: string;
  slug: string;
  articles: Awaited<ReturnType<typeof getLatestArticles>>;
}) {
  if (articles.length === 0) return null;
  const hasFlag = FLAG_SLUGS.has(slug);
  return (
    <section style={{ marginBottom: 36 }}>
      <div className="section-head">
        <h2>
          {hasFlag && (
            <img className="flag" src={`/flags/${slug}.svg`} alt="" aria-hidden />
          )}
          {title}
        </h2>
        <Link href={`/category/${slug}`} className="see-all">
          See all →
        </Link>
      </div>
      <div className="grid-4">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
