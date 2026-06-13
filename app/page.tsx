import Link from "next/link";
import { getArticlesByCategory, getLatestArticles, REVALIDATE } from "@/lib/data";
import { CATEGORIES, TEAMS } from "@/lib/taxonomy";
import { ArticleCard, SideItem } from "@/components/Cards";
import { timeAgo } from "@/lib/format";

// Homepage = "Latest News": aggregates every category. Statically generated,
// served from the CDN, and refreshed at most once a minute or instantly when a
// new article is published (revalidateTag("articles") / revalidatePath("/")).
export const revalidate = 60; // REVALIDATE.home

export default async function HomePage() {
  const [latest, transferStrip, plStrip] = await Promise.all([
    getLatestArticles(20),
    getArticlesByCategory("transfers", 4),
    getArticlesByCategory("premier-league", 4),
  ]);

  const lead = latest.find((a) => a.featured) ?? latest[0];
  const rest = latest.filter((a) => a.slug !== lead?.slug);
  const latestGrid = rest.slice(0, 8);
  const mustRead = rest.slice(8, 13);
  const editorPick = rest[13] ?? rest[0];

  return (
    <div className="container">
      <section className="welcome">
        <div className="eyebrow">Welcome to SoccerBulletin</div>
        <h1>
          The beautiful game, <em>covered</em> end to end ⚽
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
                  {t.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 3)}
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
      <CategoryStrip title="Transfer News" slug="transfers" articles={transferStrip} />
      <CategoryStrip
        title="Premier League News"
        slug="premier-league"
        articles={plStrip}
      />
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
  return (
    <section style={{ marginBottom: 36 }}>
      <div className="section-head">
        <h2>{title}</h2>
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
