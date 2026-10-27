/** American moneyline → implied probability, including the book margin. */
export function americanToImplied(odds: number): number | null {
  if (!Number.isFinite(odds) || odds === 0) return null;
  if (odds < 0) return -odds / (-odds + 100);
  return 100 / (odds + 100);
}

export function parseAmerican(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw !== 0) return raw;
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace("−", "-").replace("+", "");
  if (!cleaned || cleaned.toLowerCase() === "even" || cleaned.toLowerCase() === "ev") return 100;
  const value = Number(cleaned.startsWith("-") ? cleaned : cleaned.replace(/^\+/, ""));
  if (!Number.isFinite(value) || value === 0) return null;
  if (raw.trim().startsWith("-") || raw.trim().startsWith("−")) return -Math.abs(value);
  return value;
}

/** Remove the overround so the two prices sum to 1. */
export function fairProbs(homeAmerican: number, awayAmerican: number): { home: number; away: number } | null {
  const home = americanToImplied(homeAmerican);
  const away = americanToImplied(awayAmerican);
  if (home == null || away == null) return null;
  const sum = home + away;
  if (sum <= 0) return null;
  return { home: home / sum, away: away / sum };
}

/** Integer percents that sum to 100. */
export function percentPair(home: number, away: number): { home: number; away: number } {
  let h = Math.round(home * 100);
  let a = Math.round(away * 100);
  const drift = 100 - (h + a);
  if (drift !== 0) {
    if (h >= a) h += drift;
    else a += drift;
  }
  return { home: h, away: a };
}
