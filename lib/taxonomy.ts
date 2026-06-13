import type { Category, CategorySlug, Team } from "./types";

/**
 * "Latest News" is the homepage and aggregates every category, so it is not a
 * standalone category page — it lives at `/`.
 */
export const CATEGORIES: Category[] = [
  { slug: "international", name: "International Football News", navLabel: "International" },
  { slug: "transfers", name: "Transfer News", navLabel: "Transfers" },
  { slug: "premier-league", name: "Premier League News", navLabel: "Premier League" },
  { slug: "la-liga", name: "La Liga News", navLabel: "La Liga" },
  { slug: "bundesliga", name: "Bundesliga News", navLabel: "Bundesliga" },
  { slug: "ligue-1", name: "Ligue 1 News", navLabel: "Ligue 1" },
  { slug: "saudi-pro-league", name: "Saudi Pro League News", navLabel: "Saudi Pro League" },
];

export const CATEGORY_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const TEAMS: Team[] = [
  // Premier League
  { slug: "arsenal", name: "Arsenal", category: "premier-league" },
  { slug: "manchester-city", name: "Manchester City", category: "premier-league" },
  { slug: "liverpool", name: "Liverpool", category: "premier-league" },
  { slug: "manchester-united", name: "Manchester United", category: "premier-league" },
  { slug: "chelsea", name: "Chelsea", category: "premier-league" },
  // La Liga
  { slug: "real-madrid", name: "Real Madrid", category: "la-liga" },
  { slug: "barcelona", name: "Barcelona", category: "la-liga" },
  { slug: "atletico-madrid", name: "Atletico Madrid", category: "la-liga" },
  // Bundesliga
  { slug: "bayern-munich", name: "Bayern Munich", category: "bundesliga" },
  { slug: "borussia-dortmund", name: "Borussia Dortmund", category: "bundesliga" },
  { slug: "bayer-leverkusen", name: "Bayer Leverkusen", category: "bundesliga" },
  // Ligue 1
  { slug: "psg", name: "Paris Saint-Germain", category: "ligue-1" },
  { slug: "marseille", name: "Olympique Marseille", category: "ligue-1" },
  { slug: "monaco", name: "AS Monaco", category: "ligue-1" },
  // Saudi Pro League
  { slug: "al-nassr", name: "Al Nassr", category: "saudi-pro-league" },
  { slug: "al-hilal", name: "Al Hilal", category: "saudi-pro-league" },
  { slug: "al-ittihad", name: "Al Ittihad", category: "saudi-pro-league" },
];

export function getTeam(slug: string): Team | undefined {
  return TEAMS.find((t) => t.slug === slug);
}

export function teamsForCategory(category: CategorySlug): Team[] {
  return TEAMS.filter((t) => t.category === category);
}
