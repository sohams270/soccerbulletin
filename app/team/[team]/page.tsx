import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticlesByTeam, REVALIDATE } from "@/lib/data";
import { getTeam, getCategory } from "@/lib/taxonomy";
import { ListRow } from "@/components/Cards";

export const revalidate = 600; // REVALIDATE.team

// Generated on-demand at runtime (and then cached) so revalidateTag can bust
// the exact team page when a matching article is published.
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ team: string }[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}): Promise<Metadata> {
  const { team } = await params;
  const t = getTeam(team);
  if (!t) return { title: "Not found" };
  return {
    title: `${t.name} News`,
    description: `All the latest ${t.name} news, transfers, and match coverage.`,
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  const t = getTeam(team);
  if (!t) notFound();

  const articles = await getArticlesByTeam(team, 30);
  const league = getCategory(t.category);

  return (
    <div className="container">
      <header className="page-hero">
        <div className="team-crest" style={{ marginBottom: 12 }} aria-hidden>
          {t.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)}
        </div>
        <div className="kicker">
          {league && <Link href={`/category/${league.slug}`}>{league.name}</Link>}
        </div>
        <h1>{t.name}</h1>
        <p>{articles.length} stories</p>
      </header>

      {articles.length === 0 ? (
        <div className="empty">No {t.name} stories yet. Check back soon.</div>
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
