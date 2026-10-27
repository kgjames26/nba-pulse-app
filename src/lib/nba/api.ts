import { createServerFn } from "@tanstack/react-start";
import { isYmd } from "./dates.ts";
import type { Lang } from "./i18n.ts";
import type { GameDetail, Narrative, Slate, Standings } from "./types.ts";

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
