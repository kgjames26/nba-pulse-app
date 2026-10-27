export type ZonedParts = { y: string; m: string; d: string };

export function zonedDateParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function yyyymmdd(parts: ZonedParts): string {
  return `${parts.y}${parts.m}${parts.d}`;
}

export function addDaysYmd(ymd: string, delta: number): string {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = String(dt.getUTCFullYear());
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/** Calendar date of the NBA slate in the league's Eastern clock. */
export function etYmd(now = new Date()): string {
  return yyyymmdd(zonedDateParts(now, "America/New_York"));
}

/**
 * Home opens on the previous Eastern calendar day — the slate that has
 * normally already been played, including for viewers ahead of US time.
 */
export function referenceSlate(now = new Date()): string {
  return addDaysYmd(etYmd(now), -1);
}

export type SlateRelation = "yesterday" | "today" | "upcoming" | "archive";

export function slateRelation(ymd: string, now = new Date()): SlateRelation {
  const ref = referenceSlate(now);
  const today = etYmd(now);
  if (ymd === ref) return "yesterday";
  if (ymd === today) return "today";
  if (ymd > today) return "upcoming";
  return "archive";
}

export function formatSlateDate(ymd: string, locale: string): string {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dt);
}

export function formatTip(iso: string, locale: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(dt);
}

export function isYmd(value: string): boolean {
  return /^\d{8}$/.test(value);
}
