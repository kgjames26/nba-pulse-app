const EXACT_NATIONAL = new Set([
  "abc",
  "espn",
  "espn2",
  "espn+",
  "tnt",
  "tbs",
  "nbc",
  "nba tv",
  "prime video",
  "amazon prime video",
  "peacock",
  "trutv",
  "tru tv",
  "espn deportes",
]);

/** National window only. Local RSNs and League Pass are not a popularity signal. */
export function broadcastIsNational(market: string, name: string): boolean {
  if (market.toLowerCase() === "national") return true;
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  if (!n || n.includes("league pass") || n.includes("radio")) return false;
  if (/(sportsnet|sports net|nbc sports|msg|yes network|altitude|fox sports|bally|spectrum|space city)/i.test(name)) {
    return false;
  }
  return EXACT_NATIONAL.has(n);
}

export type Rankable = {
  id: string;
  homeId: string;
  awayId: string;
  nationalTv: boolean;
  tipoff: string;
  titleWeight: number;
};

/**
 * 1. Games involving a favorite.
 * 2. National broadcast, from the feed — not a guessed audience.
 * 3. Frozen franchise-title weight, as a documented fallback.
 * 4. Tip time.
 */
export function rankGames<T extends Rankable>(games: T[], favoriteIds: string[]): T[] {
  const fav = new Set(favoriteIds);
  return [...games].sort((a, b) => {
    const aFav = fav.has(a.homeId) || fav.has(a.awayId) ? 0 : 1;
    const bFav = fav.has(b.homeId) || fav.has(b.awayId) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    const aNat = a.nationalTv ? 0 : 1;
    const bNat = b.nationalTv ? 0 : 1;
    if (aNat !== bNat) return aNat - bNat;
    if (a.titleWeight !== b.titleWeight) return b.titleWeight - a.titleWeight;
    if (a.tipoff !== b.tipoff) return a.tipoff.localeCompare(b.tipoff);
    return a.id.localeCompare(b.id);
  });
}
