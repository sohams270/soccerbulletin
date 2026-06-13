/**
 * Centralised cache-tag vocabulary. Both the data layer (which attaches these
 * tags to cached reads) and the revalidation layer (which invalidates them on
 * publish) import from here so the two can never drift apart.
 */

/** Tags every list that can contain any article (homepage "Latest News"). */
export const TAG_ARTICLES = "articles";

/** A single article's content. */
export const tagArticle = (slug: string) => `article:${slug}`;

/** All articles in a category (powers category pages + category strips). */
export const tagCategory = (category: string) => `category:${category}`;

/** All articles about a team (powers team pages). */
export const tagTeam = (team: string) => `team:${team}`;
