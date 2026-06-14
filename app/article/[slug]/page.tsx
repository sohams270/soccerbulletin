import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  getArticlesByCategory,
  getLatestArticles,
} from "@/lib/data";
import { getCategory, getTeam } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";
import { parseContent } from "@/lib/article-content";
import { ArticleCard, SideItem } from "@/components/Cards";
import TableOfContents from "@/components/TableOfContents";
import SocialShare from "@/components/SocialShare";
import Comments from "@/components/Comments";
import ViewTracker from "@/components/ViewTracker";

// An article body is effectively immutable once published, so we cache it for
// an hour and rely on revalidatePath(`/article/${slug}`) for corrections.
export const revalidate = 3600; // REVALIDATE.article

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

  const [sameCategory, latest] = await Promise.all([
    getArticlesByCategory(article.category, 6),
    getLatestArticles(16),
  ]);

  // Right rail "Also Read": similar pieces from the same category first. If the
  // category is thin, top up with other recent stories so the rail is never
  // empty. `used` tracks what we've shown to avoid repeats further down.
  const used = new Set<string>([article.slug]);
  const alsoRead = sameCategory.filter((a) => !used.has(a.slug));
  alsoRead.forEach((a) => used.add(a.slug));
  if (alsoRead.length < 4) {
    for (const a of latest) {
      if (alsoRead.length >= 4) break;
      if (a.category !== article.category && !used.has(a.slug)) {
        alsoRead.push(a);
        used.add(a.slug);
      }
    }
  }

  // Below the article: fresh news from *other* categories (no repeats of the
  // rail above).
  const fromOtherCategories = latest
    .filter((a) => a.category !== article.category && !used.has(a.slug))
    .slice(0, 8);

  const { blocks, toc } = parseContent(article.content);

  // Tags derived from the article's taxonomy.
  const tags: { label: string; href?: string }[] = [
    { label: category?.navLabel ?? article.category, href: `/category/${article.category}` },
    ...(team ? [{ label: team.name, href: `/team/${team.slug}` }] : []),
    { label: "Football" },
    { label: article.source },
  ];

  const authorBio = `${article.author} is a football writer for SoccerBulletin, covering ${
    category?.navLabel ?? "world football"
  } and the stories shaping the global game.`;

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
      <ViewTracker slug={article.slug} />

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

      <div className="article-layout">
        {/* Left rail: table of contents */}
        <aside className="article-toc-rail">
          <div className="toc-sticky">
            <TableOfContents items={toc} />
          </div>
        </aside>

        {/* Center: the article */}
        <article className="article">
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
            {article.views > 0 && (
              <>
                <span className="dot" />
                <span>{article.views.toLocaleString()} views</span>
              </>
            )}
          </div>

          <div className="article-hero">
            <img src={article.imageUrl} alt={article.title} />
          </div>

          <div className="article-body">
            {blocks.map((block, i) =>
              block.type === "heading" ? (
                block.level === 2 ? (
                  <h2 key={i} id={block.id}>
                    {block.text}
                  </h2>
                ) : (
                  <h3 key={i} id={block.id}>
                    {block.text}
                  </h3>
                )
              ) : (
                <p key={i}>{block.text}</p>
              )
            )}
          </div>

          {/* Tags */}
          <div className="article-tags" aria-label="Tags">
            {tags.map((t) =>
              t.href ? (
                <Link key={t.label} href={t.href} className="tag">
                  #{t.label}
                </Link>
              ) : (
                <span key={t.label} className="tag">
                  #{t.label}
                </span>
              )
            )}
          </div>

          {/* Share */}
          <SocialShare
            variant="inline"
            label="Share this article"
            url={`https://soccerbulletin.vercel.app/article/${article.slug}`}
            title={article.title}
          />

          {/* Author bio */}
          <div className="author-bio">
            <span className="author-bio-avatar">{article.author.slice(0, 2)}</span>
            <div>
              <span className="author-bio-name">{article.author}</span>
              <p>{authorBio}</p>
            </div>
          </div>

          {/* Comments */}
          <Comments slug={article.slug} />
        </article>

        {/* Right rail: Also Read (same category) */}
        <aside className="article-aside">
          {alsoRead.length > 0 && (
            <div className="side-block toc-sticky">
              <div className="section-head">
                <h2>Also Read</h2>
              </div>
              {alsoRead.map((a) => (
                <SideItem key={a.id} article={a} />
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Below: news from other categories */}
      {fromOtherCategories.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-head">
            <h2>More from SoccerBulletin</h2>
            <Link href="/" className="see-all">
              See all →
            </Link>
          </div>
          <div className="grid-4">
            {fromOtherCategories.map((a) => (
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
