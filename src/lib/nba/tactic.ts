import type { Tactic } from "./types.ts";

const BLOCKED_HOST =
  /^(?:(?:www|m|mobile)\.)?(?:x\.com|twitter\.com|facebook\.com|instagram\.com|tiktok\.com|reddit\.com|youtube\.com|youtu\.be|google\.com|news\.google\.com|bing\.com|duckduckgo\.com)$/i;

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function canon(url: string): string | null {
  try {
    const value = new URL(url);
    if (value.protocol !== "https:") return null;
    const host = value.hostname.replace(/^www\./, "").toLowerCase();
    if (BLOCKED_HOST.test(value.hostname) || BLOCKED_HOST.test(host)) return null;
    const path = value.pathname.replace(/\/+$/, "").toLowerCase();
    if (/\/(?:box-?score|play-by-play|gametracker)(?:\/|$)|\/teams\/|\.pdf$/i.test(path)) return null;
    if (/\/game(?:\/|$)/.test(path) && !/\/news\//.test(path)) return null;
    const segments = path.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    return `${host}${path}`;
  } catch {
    return null;
  }
}

function cleanProse(value: string, max: number): string {
  const text = value
    .replace(/\[\[\d+\]\]\([^)]*\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max).trim();
}

function titleFrom(raw: string, url: string): string {
  const cleaned = cleanProse(raw, 140);
  if (cleaned.length >= 8 && !/^\d+$/.test(cleaned)) return cleaned;
  try {
    const slug = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
    const pretty = slug.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
    if (pretty.length >= 8 && !/^\d+$/.test(pretty)) return pretty.slice(0, 140);
  } catch {
    // The hostname below is the last readable label.
  }
  return sourceHost(url);
}

function mentions(text: string, name: string): boolean {
  return name.length > 0 && text.toLowerCase().includes(name.toLowerCase());
}

export function collectResearch(body: unknown): { text: string; citations: string[] } {
  const root = (body ?? {}) as {
    citations?: unknown;
    output_text?: unknown;
    output?: unknown;
  };
  const citations: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.startsWith("https://")) citations.push(value);
  };
  if (Array.isArray(root.citations)) {
    for (const item of root.citations) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object" && "url" in item) push((item as { url?: unknown }).url);
    }
  }
  const chunks: string[] = [];
  if (typeof root.output_text === "string") chunks.push(root.output_text);
  if (Array.isArray(root.output)) {
    for (const item of root.output) {
      const action = (item as { action?: { sources?: { url?: unknown }[] } }).action;
      for (const source of action?.sources ?? []) push(source?.url);
      const content = (item as { content?: unknown }).content;
      if (typeof (item as { text?: unknown }).text === "string" && !content) chunks.push((item as { text: string }).text);
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        const row = block as { type?: string; text?: string; annotations?: { type?: string; url?: string }[] };
        if ((row.type === "output_text" || row.type === "text" || !row.type) && typeof row.text === "string") chunks.push(row.text);
        for (const note of row.annotations ?? []) {
          if (!note.type || note.type === "url_citation") push(note.url);
        }
      }
    }
  }
  return { text: chunks.join("\n").trim(), citations };
}

export function parseTactic(
  raw: string,
  citations: string[],
  sides: { winner: string; loser: string },
): Tactic | null {
  if (!sides.winner || !sides.loser) return null;
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let value: { lead?: unknown; worked?: unknown; failed?: unknown; sources?: unknown };
  try {
    value = JSON.parse(cleaned.slice(start, end + 1)) as typeof value;
  } catch {
    return null;
  }
  let worked = typeof value.worked === "string" ? cleanProse(value.worked, 1400) : "";
  let failed = typeof value.failed === "string" ? cleanProse(value.failed, 1400) : "";
  if (worked.length < 180 || failed.length < 180) return null;
  const workedLoser = mentions(worked, sides.loser) && !mentions(worked, sides.winner);
  const failedWinner = mentions(failed, sides.winner) && !mentions(failed, sides.loser);
  if (workedLoser && failedWinner) {
    const swap = worked;
    worked = failed;
    failed = swap;
  }
  const allowed = new Set(citations.map(canon).filter((item): item is string => item != null));
  if (!allowed.size) return null;
  const sources: Tactic["sources"] = [];
  const seen = new Set<string>();
  if (Array.isArray(value.sources)) {
    for (const item of value.sources) {
      const row = item as { title?: unknown; url?: unknown };
      if (typeof row.url !== "string") continue;
      const key = canon(row.url);
      if (!key || !allowed.has(key) || seen.has(key)) continue;
      seen.add(key);
      sources.push({ title: titleFrom(typeof row.title === "string" ? row.title : "", row.url), url: row.url });
      if (sources.length === 4) break;
    }
  }
  if (!sources.length) return null;
  const lead = typeof value.lead === "string" ? cleanProse(value.lead, 500) : "";
  return {
    lead: lead.length >= 40 ? lead : "",
    winner: sides.winner,
    loser: sides.loser,
    worked,
    failed,
    sources,
  };
}
