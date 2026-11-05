import { createServerFn } from "@tanstack/react-start";
import { isYmd } from "./dates.ts";
import type { Lang } from "./i18n.ts";
import type { GameDetail, Narrative, PlayoffSeriesScore, Slate, Standings } from "./types.ts";

const LANGS = new Set<Lang>(["fr", "en", "es", "tr", "ar", "zh"]);

function asLang(value: unknown): Lang | null {
  return typeof value === "string" && LANGS.has(value as Lang) ? (value as Lang) : null;
}

export const getSlate = createServerFn({ method: "POST" })
  .validator((input: { date: string }) => {
    if (!input || !isYmd(input.date)) throw new Error("bad date");
    return { date: input.date };
  })
  .handler(async ({ data }): Promise<{ ok: true; slate: Slate } | { ok: false; error: "feed" }> => {
    try {
      const { loadSlate } = await import("./espn.server.ts");
      return { ok: true, slate: await loadSlate(data.date) };
    } catch {
      return { ok: false, error: "feed" };
    }
  });

export const getGame = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (!input || !/^\d{5,12}$/.test(input.id)) throw new Error("bad id");
    return { id: input.id };
  })
  .handler(async ({ data }): Promise<{ ok: true; detail: GameDetail } | { ok: false; error: "feed" }> => {
    try {
      const { loadGame } = await import("./espn.server.ts");
      return { ok: true, detail: await loadGame(data.id) };
    } catch {
      return { ok: false, error: "feed" };
    }
  });

export const getStandings = createServerFn({ method: "POST" })
  .validator((input: { confirm: true }) => input)
  .handler(async (): Promise<{ ok: true; standings: Standings } | { ok: false; error: "feed" }> => {
    try {
      const { loadStandings } = await import("./espn.server.ts");
      return { ok: true, standings: await loadStandings() };
    } catch {
      return { ok: false, error: "feed" };
    }
  });

export const getNarrative = createServerFn({ method: "POST" })
  .validator((input: { id: string; lang: Lang; kind: "recap" | "duels" }) => {
    if (!input || !/^\d{5,12}$/.test(input.id)) throw new Error("bad id");
    if (!asLang(input.lang)) throw new Error("bad lang");
    if (input.kind !== "recap" && input.kind !== "duels") throw new Error("bad kind");
    return input;
  })
  .handler(async ({ data }): Promise<Narrative> => {
    try {
      const { loadNarrative } = await import("./narrative.server.ts");
      return await loadNarrative(data.id, data.lang, data.kind);
    } catch {
      return { mode: "stat" };
    }
  });

export const getNews = createServerFn({ method: "POST" })
  .validator((input: { refresh: boolean; lang: Lang }) => {
    if (!input || typeof input.refresh !== "boolean" || !asLang(input.lang)) throw new Error("bad news request");
    return { refresh: input.refresh, lang: input.lang };
  })
  .handler(async ({ data }): Promise<
    | { ok: true; articles: import("./news.server.ts").NbaNewsItem[]; translation: import("./news.server.ts").NewsTranslation }
    | { ok: false; articles: []; translation: "unavailable" }
  > => {
    try {
      const { loadNews } = await import("./news.server.ts");
      return { ok: true, ...(await loadNews(data.lang, data.refresh)) };
    } catch {
      return { ok: false, articles: [], translation: "unavailable" };
    }
  });


export const getPlayoffScores = createServerFn({ method: "POST" })
  .validator((input: { seasonYear: number }) => {
    if (!input || !Number.isInteger(input.seasonYear) || input.seasonYear < 2000 || input.seasonYear > 2100) {
      throw new Error("bad season");
    }
    return { seasonYear: input.seasonYear };
  })
  .handler(async ({ data }): Promise<
    | { ok: true; scores: PlayoffSeriesScore[] }
    | { ok: false; error: "feed" }
  > => {
    try {
      const { loadPlayoffSeriesScores } = await import("./espn.server.ts");
      return { ok: true, scores: await loadPlayoffSeriesScores(data.seasonYear) };
    } catch {
      return { ok: false, error: "feed" };
    }
  });
