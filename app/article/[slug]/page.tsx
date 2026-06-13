import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug, getArticlesByCategory, REVALIDATE } from "@/lib/data";
import { getCategory, getTeam } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";
import { ArticleCard } from "@/components/Cards";

// An article body is effectively immutable once published, so we cache it for
// an hour and rely on revalidatePath(`/article/${slug}`) for corrections.
export const revalidate = 3600; // REVALIDATE.article

// With thousands of articles, prerendering them all at build is wasteful and
// would make publishing slow. Instead every article is generated on first
// request and then cached (on-demand ISR). Generating at runtime is also what
// lets revalidateTag bust the page later — see lib/data.ts. To pre-warm hot
// content for SEO you could return the N most recent slugs here instead of [].
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategory(article.category);
  const team = article.team ? getTeam(article.team) : undefined;
  const related = (await getArticlesByCategory(article.category, 5))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [article.imageUrl],
    datePublished: article.publishedAt,
    author: [{ "@type": "Person", name: article.author }],
    publisher: { "@type": "Organization", name: "SoccerBulletin" },
  };

  return (
    <div className="container">
      <article className="article">
        <div className="breadcrumb">
          <Link href="/">Home</Link> ›{" "}
          {category && (
            <>
              <Link href={`/category/${category.slug}`}>{category.name}</Link>
              {team && " › "}
            </>
          )}
          {team && <Link href={`/team/${team.slug}`}>{team.name}</Link>}
        </div>

        <span className="chip">{category?.navLabel}</span>
        <h1>{article.title}</h1>
        <p className="lede">{article.excerpt}</p>

        <div className="article-meta">
          <span className="avatar">{article.author.slice(0, 2)}</span>
          <span>
            By <strong>{article.author}</strong>
          </span>
          <span className="dot" />
          <span>{formatDate(article.publishedAt)}</span>
          <span className="dot" />
          <span>{article.readMinutes} min read</span>
        </div>

        <div className="article-hero">
          <img src={article.imageUrl} alt={article.title} />
        </div>

        <div className="article-body">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {team && (
          <p style={{ marginTop: 28 }}>
            <Link href={`/team/${team.slug}`} className="btn-write">
              More on {team.name} →
            </Link>
          </p>
        )}
      </article>

      {related.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-head">
            <h2>More {category?.navLabel} News</h2>
            <Link href={`/category/${article.category}`} className="see-all">
              See all →
            </Link>
          </div>
          <div className="grid-4">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
