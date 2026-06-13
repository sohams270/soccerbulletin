import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticlesByCategory, REVALIDATE } from "@/lib/data";
import { getCategory, teamsForCategory } from "@/lib/taxonomy";
import type { CategorySlug } from "@/lib/types";
import { ListRow } from "@/components/Cards";

export const revalidate = 300; // REVALIDATE.category

// Generated on-demand at runtime (and then cached) so revalidateTag can bust
// the exact category page when a matching article is published. Invalid slugs
// fall through to notFound().
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ category: string }[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return { title: "Not found" };
  return {
    title: cat.name,
    description: `The latest ${cat.name.toLowerCase()} — breaking stories, transfers, and match analysis.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const articles = await getArticlesByCategory(category as CategorySlug, 30);
  const teams = teamsForCategory(category as CategorySlug);

  return (
    <div className="container">
      <header className="page-hero">
        <div className="kicker">SoccerBulletin</div>
        <h1>{cat.name}</h1>
        <p>{articles.length} stories · updated continuously</p>
      </header>

      {teams.length > 0 && (
        <div className="team-rail" style={{ marginBottom: 12 }}>
          {teams.map((t) => (
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
      )}

      {articles.length === 0 ? (
        <div className="empty">No stories published yet. Check back soon.</div>
      ) : (
        <div>
          {articles.map((a) => (
            <ListRow key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
