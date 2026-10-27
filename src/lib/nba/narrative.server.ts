import { modelFacts, recapFacts } from "./bundle.ts";
import { loadGame } from "./espn.server.ts";
import type { Lang } from "./i18n.ts";
import { collectResearch, parseTactic } from "./tactic.ts";
import type { DuelCopy, Narrative, Tactic } from "./types.ts";

const LANG_NAME: Record<Lang, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  tr: "Turkish",
  ar: "Arabic",
  zh: "Simplified Chinese",
};

const recent: number[] = [];

function allowCall(): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0]! > 10 * 60 * 1000) recent.shift();
  if (recent.length >= 20) return false;
  recent.push(now);
  return true;
}

function grounded(text: string, corpus: string): boolean {
  const nums = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return nums.every((raw) => {
    const norm = raw.replace(",", ".");
    const escaped = norm.replace(".", "\\.");
    return new RegExp(`(^|[^\\d])${escaped}([^\\d]|$)`).test(corpus);
  });
}

function tacticReady(tactic: Tactic | undefined): boolean {
  return Boolean(
    tactic &&
      tactic.worked.length >= 180 &&
      tactic.failed.length >= 180 &&
      tactic.winner &&
      tactic.loser &&
      tactic.sources.some((source) => source.url.startsWith("https://") && source.title),
  );
}

async function readCache(key: string, maxAgeMs: number): Promise<Narrative | null> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ payload: string; created_at: string }>`
      select payload, created_at from nba_ai_cache where cache_key = ${key}
    `;
    const row = rows[0];
    if (!row) return null;
    const created = Date.parse(String(row.created_at));
    if (!Number.isFinite(created) || Date.now() - created > maxAgeMs) return null;
    const parsed = JSON.parse(row.payload) as Narrative;
    if (parsed?.mode !== "desk") return null;
    if (key.startsWith("recap:") && !tacticReady(parsed.tactic)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(key: string, kind: string, payload: Narrative): Promise<void> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const body = JSON.stringify(payload);
    const created = new Date().toISOString();
    await sql`
      insert into nba_ai_cache (cache_key, kind, payload, created_at)
      values (${key}, ${kind}, ${body}, ${created})
      on conflict (cache_key) do update set payload = excluded.payload, created_at = excluded.created_at
    `;
  } catch {
    // Cache is an optimization. The reading still returns.
  }
}

async function complete(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || !allowCall()) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 480,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

const SEARCH_DOMAINS = ["espn.com", "nba.com", "cbssports.com", "basketusa.com", "lequipe.fr"];

async function research(prompt: string): Promise<{ text: string; citations: string[] } | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || !allowCall()) return null;
  const attempts = [
    { model: "grok-4.5", domains: true },
    { model: "grok-4.7", domains: false },
  ];
  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index]!;
    try {
      const tools = attempt.domains
        ? [{ type: "web_search", filters: { allowed_domains: SEARCH_DOMAINS } }]
        : [{ type: "web_search" }];
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        signal: AbortSignal.timeout(45_000),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: attempt.model,
          temperature: 0.2,
          max_output_tokens: 1600,
          input: [{ role: "user", content: prompt }],
          tools,
        }),
      });
      if (!res.ok) {
        if (index === attempts.length - 1) return null;
        if (res.status === 400 || res.status === 404 || res.status === 422) continue;
        return null;
      }
      const found = collectResearch(await res.json());
      if (found.text && found.citations.length) return found;
      if (index === attempts.length - 1) return null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseDuels(text: string): DuelCopy[] | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(cleaned.slice(start, end + 1)) as { duels?: unknown };
    if (!Array.isArray(value.duels)) return null;
    const duels = value.duels
      .map((item) => {
        const row = item as { title?: unknown; body?: unknown };
        const title = typeof row.title === "string" ? row.title.trim() : "";
        const body = typeof row.body === "string" ? row.body.trim() : "";
        return title && body ? { title, body } : null;
      })
      .filter((item): item is DuelCopy => item != null)
      .slice(0, 4);
    return duels.length >= 2 ? duels : null;
  } catch {
    return null;
  }
}

export async function loadNarrative(gameId: string, lang: Lang, kind: "recap" | "duels"): Promise<Narrative> {
  const key = kind === "recap" ? `recap:v2:${gameId}:${lang}` : `${kind}:${gameId}:${lang}`;
  const maxAge = kind === "recap" ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 3;
  const cached = await readCache(key, maxAge);
  if (cached) return cached;

  const detail = await loadGame(gameId);
  if (kind === "recap" && detail.game.status !== "post") return { mode: "stat" };
  if (kind === "duels" && detail.game.status !== "pre") return { mode: "stat" };

  const facts = modelFacts(detail);
  const corpus = JSON.stringify(facts);
  const language = LANG_NAME[lang];

  if (kind === "recap") {
    const briefFacts = recapFacts(detail);
    if (!briefFacts?.winner || !briefFacts.loser) return { mode: "stat" };
    const brief = {
      tipoff: detail.game.tipoff,
      away: briefFacts.awayName,
      home: briefFacts.homeName,
      awayAbbr: detail.game.away.abbr,
      homeAbbr: detail.game.home.abbr,
      awayScore: briefFacts.awayScore,
      homeScore: briefFacts.homeScore,
      winner: briefFacts.winner,
      loser: briefFacts.loser,
      margin: briefFacts.margin,
      overtime: briefFacts.ot,
      halftimeLeader: briefFacts.halfLeader,
      quartersAway: detail.game.away.lines,
      quartersHome: detail.game.home.lines,
      topScorers: briefFacts.tops,
      venue: briefFacts.venue,
    };
    const found = await research(
      `You are an NBA tactical editor. Use web search and read recaps about this exact game before you write. Write in ${language}.

Rules:
- Search for game recaps and tactical breakdowns. Prefer pieces that explain scheme, not just the box score.
- FACTS are the score of record. Never contradict the winner, the loser, or the final score.
- worked describes only what worked for the winner. failed describes only what did not work for the loser: the coverage they beat or failed to solve, pace, shot profile, glass, turnovers, star usage, and the adjustment that never came.
- Write tactics, not a box-score paraphrase. A few figures from the articles are welcome. Do not turn a paragraph into a stat line.
- Use basketball words in ${language}. In French say « passes décisives », « balles perdues », « lancers francs », « raquette », « rebonds », « tirs à trois points » — never assists, turnovers, free throws, paint or rebounds inside French prose.
- Every tactical claim must come from an article you found in this search. Do not rely on memory. Do not invent quotes, injuries, or plays.
- Do not mention betting, odds, or gambling.
- Do not translate franchise or player names.
- If you cannot find at least one article specifically about this game, return {"lead":"","worked":"","failed":"","sources":[]}.
- Return JSON only, no markdown fence:
{"lead":"two sentences of tactical context","worked":"90 to 140 words","failed":"90 to 140 words","sources":[{"title":"headline","url":"https://full-article-url"}]}
- sources: 2 to 4 article URLs you actually opened. No homepages, no social posts.

WINNER: ${briefFacts.winner}
LOSER: ${briefFacts.loser}

FACTS:
${JSON.stringify(brief)}`,
    );
    const tactic = found ? parseTactic(found.text, found.citations, { winner: briefFacts.winner, loser: briefFacts.loser }) : null;
    if (!tactic) return { mode: "stat" };
    const narrative: Narrative = { mode: "desk", text: tactic.lead, duels: [], tactic };
    await writeCache(key, kind, narrative);
    return narrative;
  }

  const text = await complete(
    `Return JSON only: {"duels":[{"title":"...","body":"..."}]} with 2 to 4 items, in ${language}. Use only FACTS. Never present a player whose injury status is Out as someone who will play. If a status is questionable or day-to-day, say it is uncertain. No betting. Do not translate names. No markdown. Every number must already appear in FACTS.`,
    corpus,
  );
  const duels = text ? parseDuels(text) : null;
  if (!duels || !grounded(duels.map((duel) => `${duel.title} ${duel.body}`).join(" "), corpus)) {
    return { mode: "stat" };
  }
  const narrative: Narrative = { mode: "desk", text: "", duels };
  await writeCache(key, kind, narrative);
  return narrative;
}
