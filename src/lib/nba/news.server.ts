export type NbaNewsItem = {
  id: string;
  headline: string;
  description: string;
  url: string;
  image: string | null;
  published: string;
  byline: string;
};

type Cache = { expiresAt: number; articles: NbaNewsItem[] };
let cache: Cache | null = null;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function loadNews(): Promise<NbaNewsItem[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.articles;

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

    cache = { expiresAt: Date.now() + 5 * 60_000, articles };
    return articles;
  } finally {
    clearTimeout(timeout);
  }
}
