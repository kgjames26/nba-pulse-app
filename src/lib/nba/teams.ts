export type Conference = "east" | "west";

export type Franchise = {
  id: string;
  abbr: string;
  slug: string;
  name: string;
  city: string;
  conference: Conference;
  /** NBA franchise titles through the 2025 Finals. Fallback sort only — not a live stat. */
  titles: number;
  color: string;
};

export const UNKNOWN_COLOR = "#8a8478";

/**
 * Championship counts are a frozen editorial fallback (October 2026), used only
 * when a game has no national broadcast. They are not displayed as standings.
 * Oklahoma City counts the 2025 title only — not the 1979 SuperSonics banner.
 */
export const TEAMS: Franchise[] = [
  { id: "1", abbr: "ATL", slug: "atl", name: "Atlanta Hawks", city: "Atlanta", conference: "east", titles: 1, color: "#E03A3E" },
  { id: "2", abbr: "BOS", slug: "bos", name: "Boston Celtics", city: "Boston", conference: "east", titles: 18, color: "#007A33" },
  { id: "17", abbr: "BKN", slug: "bkn", name: "Brooklyn Nets", city: "Brooklyn", conference: "east", titles: 0, color: "#FFFFFF" },
  { id: "30", abbr: "CHA", slug: "cha", name: "Charlotte Hornets", city: "Charlotte", conference: "east", titles: 0, color: "#1D1160" },
  { id: "4", abbr: "CHI", slug: "chi", name: "Chicago Bulls", city: "Chicago", conference: "east", titles: 6, color: "#CE1141" },
  { id: "5", abbr: "CLE", slug: "cle", name: "Cleveland Cavaliers", city: "Cleveland", conference: "east", titles: 1, color: "#860038" },
  { id: "6", abbr: "DAL", slug: "dal", name: "Dallas Mavericks", city: "Dallas", conference: "west", titles: 1, color: "#00538C" },
  { id: "7", abbr: "DEN", slug: "den", name: "Denver Nuggets", city: "Denver", conference: "west", titles: 1, color: "#0E2240" },
  { id: "8", abbr: "DET", slug: "det", name: "Detroit Pistons", city: "Detroit", conference: "east", titles: 3, color: "#C8102E" },
  { id: "9", abbr: "GS", slug: "gs", name: "Golden State Warriors", city: "Golden State", conference: "west", titles: 7, color: "#1D428A" },
  { id: "10", abbr: "HOU", slug: "hou", name: "Houston Rockets", city: "Houston", conference: "west", titles: 2, color: "#CE1141" },
  { id: "11", abbr: "IND", slug: "ind", name: "Indiana Pacers", city: "Indiana", conference: "east", titles: 0, color: "#002D62" },
  { id: "12", abbr: "LAC", slug: "lac", name: "LA Clippers", city: "LA", conference: "west", titles: 0, color: "#C8102E" },
  { id: "13", abbr: "LAL", slug: "lal", name: "Los Angeles Lakers", city: "Los Angeles", conference: "west", titles: 17, color: "#552583" },
  { id: "29", abbr: "MEM", slug: "mem", name: "Memphis Grizzlies", city: "Memphis", conference: "west", titles: 0, color: "#5D76A9" },
  { id: "14", abbr: "MIA", slug: "mia", name: "Miami Heat", city: "Miami", conference: "east", titles: 3, color: "#98002E" },
  { id: "15", abbr: "MIL", slug: "mil", name: "Milwaukee Bucks", city: "Milwaukee", conference: "east", titles: 2, color: "#00471B" },
  { id: "16", abbr: "MIN", slug: "min", name: "Minnesota Timberwolves", city: "Minnesota", conference: "west", titles: 0, color: "#0C2340" },
  { id: "3", abbr: "NO", slug: "no", name: "New Orleans Pelicans", city: "New Orleans", conference: "west", titles: 0, color: "#0C2340" },
  { id: "18", abbr: "NY", slug: "ny", name: "New York Knicks", city: "New York", conference: "east", titles: 2, color: "#006BB6" },
  { id: "25", abbr: "OKC", slug: "okc", name: "Oklahoma City Thunder", city: "Oklahoma City", conference: "west", titles: 1, color: "#007AC1" },
  { id: "19", abbr: "ORL", slug: "orl", name: "Orlando Magic", city: "Orlando", conference: "east", titles: 0, color: "#0077C0" },
  { id: "20", abbr: "PHI", slug: "phi", name: "Philadelphia 76ers", city: "Philadelphia", conference: "east", titles: 3, color: "#006BB6" },
  { id: "21", abbr: "PHX", slug: "phx", name: "Phoenix Suns", city: "Phoenix", conference: "west", titles: 0, color: "#1D1160" },
  { id: "22", abbr: "POR", slug: "por", name: "Portland Trail Blazers", city: "Portland", conference: "west", titles: 1, color: "#E03A3E" },
  { id: "23", abbr: "SAC", slug: "sac", name: "Sacramento Kings", city: "Sacramento", conference: "west", titles: 1, color: "#5A2D81" },
  { id: "24", abbr: "SA", slug: "sa", name: "San Antonio Spurs", city: "San Antonio", conference: "west", titles: 5, color: "#C4CED4" },
  { id: "28", abbr: "TOR", slug: "tor", name: "Toronto Raptors", city: "Toronto", conference: "east", titles: 1, color: "#CE1141" },
  { id: "26", abbr: "UTA", slug: "utah", name: "Utah Jazz", city: "Utah", conference: "west", titles: 0, color: "#002B5C" },
  { id: "27", abbr: "WSH", slug: "wsh", name: "Washington Wizards", city: "Washington", conference: "east", titles: 1, color: "#002B5C" },
];

const byId = new Map(TEAMS.map((team) => [team.id, team]));

export function franchiseById(id: string): Franchise | undefined {
  return byId.get(id);
}

export function titleWeight(homeId: string, awayId: string): number {
  return (byId.get(homeId)?.titles ?? 0) + (byId.get(awayId)?.titles ?? 0);
}

export function cssColor(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const hex = raw.replace("#", "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : fallback;
}

export function darkLogo(slug: string): string {
  return `https://a.espncdn.com/i/teamlogos/nba/500-dark/${slug}.png`;
}

export function colorLogo(slug: string): string {
  return `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`;
}
