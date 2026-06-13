import Link from "next/link";
import type { Article } from "@/lib/types";
import { getCategory } from "@/lib/taxonomy";
import { timeAgo } from "@/lib/format";

function categoryName(article: Article): string {
  return getCategory(article.category)?.navLabel ?? article.category;
}

/** Grid card used in "Latest News" and category strips. */
export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="card">
      <div className="card-img">
        <img src={article.imageUrl} alt={article.title} loading="lazy" />
      </div>
      <span className="chip">{categoryName(article)}</span>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <span className="meta">
        {article.source}
        <span className="dot" />
        {timeAgo(article.publishedAt)}
      </span>
    </Link>
  );
}

/** Compact horizontal item for sidebars (Must Read / Sport News). */
export function SideItem({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="side-item">
      <div className="side-thumb">
        <img src={article.imageUrl} alt={article.title} loading="lazy" />
      </div>
      <div>
        <h4>{article.title}</h4>
        <span className="meta">
          {article.source}
          <span className="dot" />
          {timeAgo(article.publishedAt)}
        </span>
      </div>
    </Link>
  );
}

/** Wide row used on category and team listing pages. */
export function ListRow({ article }: { article: Article }) {
  return (
    <article className="list-row">
      <Link href={`/article/${article.slug}`} className="card">
        <div className="card-img">
          <img src={article.imageUrl} alt={article.title} loading="lazy" />
        </div>
      </Link>
      <div>
        <span className="chip">{categoryName(article)}</span>
        <h3>
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
        <span className="meta">
          By {article.author}
          <span className="dot" />
          {article.source}
          <span className="dot" />
          {timeAgo(article.publishedAt)}
        </span>
      </div>
    </article>
  );
}
