import type { Metadata } from "next";
import { searchArticles } from "@/lib/store";
import { ListRow } from "@/components/Cards";

// Search results reflect live data, including just-published articles, so the
// page is rendered per-request and excluded from the index.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const results = term.length >= 2 ? await searchArticles(term, 50) : [];

  return (
    <div className="container">
      <header className="page-hero">
        <div className="kicker">SoccerBulletin</div>
        <h1>{term ? `Search: “${term}”` : "Search"}</h1>
        <p>
          {term.length < 2
            ? "Type at least two characters to search."
            : `${results.length} ${results.length === 1 ? "result" : "results"}`}
        </p>
      </header>

      {term.length >= 2 && results.length === 0 ? (
        <div className="empty">
          No stories match “{term}”. Try a different keyword.
        </div>
      ) : (
        <div>
          {results.map((a) => (
            <ListRow key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
