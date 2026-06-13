export type CategorySlug =
  | "international"
  | "transfers"
  | "premier-league"
  | "la-liga"
  | "bundesliga"
  | "ligue-1"
  | "saudi-pro-league";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: CategorySlug;
  /** Team slug this article is primarily about (used for team page revalidation). */
  team: string | null;
  author: string;
  source: string;
  imageUrl: string;
  publishedAt: string; // ISO string
  readMinutes: number;
  featured: boolean;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Short label used in the nav bar. */
  navLabel: string;
}

export interface Team {
  slug: string;
  name: string;
  category: CategorySlug;
}

export interface NewArticleInput {
  title: string;
  excerpt: string;
  content: string;
  category: CategorySlug;
  team?: string | null;
  author?: string;
  source?: string;
  imageUrl?: string;
  readMinutes?: number;
  featured?: boolean;
}
