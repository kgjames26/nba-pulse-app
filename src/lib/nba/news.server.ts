import type { Lang } from "./i18n.ts";

export type NbaNewsItem = {
  id: string;
  headline: string;
  description: string;
  url: string;
  image: string | null;
  published: string;
  byline: string;
};

export type NewsTranslation = "google" | "original" | "unavailable";
export type NbaNewsResponse = { articles: NbaNewsItem[]; translation: NewsTranslation };

type Cache<T> = { expiresAt: number; value: T };
let newsCache: Cache<NbaNewsItem[]> | null = null;
const translationCache = new Map<Lang, Cache<NbaNewsResponse>>();

const GOOGLE_LANGUAGE: Record<Lang, string> = {
  fr: "fr",
  en: "en",
  es: "es",
  tr: "tr",
  ar: "ar",
  zh: "zh-CN",
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchNews(refresh: boolean): Promise<NbaNewsItem[]> {
  if (!refresh && newsCache && newsCache.expiresAt > Date.now()) return newsCache.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news", {
      headers: { accept: "application/json", "user-agent": "NBAPulse/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`news feed ${response.status}`);

    const payload = record(await response.json());
    const rawArticles = Array.isArray(payload?.articles) ? payload.articles : [];
    const articles = rawArticles.flatMap((value, index) => {
      const item = record(value);
      const headline = text(item?.headline);
      const url = text(record(record(item?.links)?.web)?.href);
      if (!item || !headline || !/^https:\/\//i.test(url)) return [];

      const images = Array.isArray(item.images) ? item.images : [];
      const imageRow = record(images[0]);
      return [{
        id: text(item.id) || url || String(index),
        headline,
        description: text(item.description) || text(item.title),
        url,
        image: text(imageRow?.url) || null,
        published: text(item.published),
        byline: text(item.byline),
      }];
    }).slice(0, 20);

    newsCache = { expiresAt: Date.now() + 5 * 60_000, value: articles };
    return articles;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateArticles(articles: NbaNewsItem[], lang: Lang): Promise<NbaNewsResponse> {
  if (lang === "en") return { articles, translation: "original" };

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!apiKey) return { articles, translation: "unavailable" };

  const texts = articles.flatMap((article) => [article.headline, article.description]);
  if (texts.length === 0) return { articles, translation: "google" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ q: texts, target: GOOGLE_LANGUAGE[lang], format: "text" }),
        signal: controller.signal,
      },
    );
    if (!response.ok) return { articles, translation: "unavailable" };

    const payload = record(await response.json());
    const data = record(payload?.data);
    const translations = Array.isArray(data?.translations) ? data.translations : [];
    if (translations.length !== texts.length) return { articles, translation: "unavailable" };

    const translatedText = translations.map((value) => text(record(value)?.translatedText));
    if (translatedText.some((value) => !value)) return { articles, translation: "unavailable" };

    return {
      articles: articles.map((article, index) => ({
        ...article,
        headline: translatedText[index * 2] ?? article.headline,
        description: translatedText[index * 2 + 1] ?? article.description,
      })),
      translation: "google",
    };
  } catch {
    return { articles, translation: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadNews(lang: Lang, refresh = false): Promise<NbaNewsResponse> {
  const cached = translationCache.get(lang);
  if (!refresh && cached && cached.expiresAt > Date.now()) return cached.value;

  const articles = await fetchNews(refresh);
  const result = await translateArticles(articles, lang);
  translationCache.set(lang, { expiresAt: Date.now() + 5 * 60_000, value: result });
  return result;
}
