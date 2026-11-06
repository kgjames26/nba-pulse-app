import { useQuery } from "@tanstack/react-query";
import { getNews } from "@/lib/nba/api";
import { localeFor, t, type Lang } from "@/lib/nba/i18n";
import { PageHeader } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  empty: string;
  error: string;
}> = {
  fr: { title: "Actualités", empty: "Aucune actualité disponible pour le moment.", error: "Le flux d’actualités n’a pas répondu." },
  en: { title: "News", empty: "No news is available right now.", error: "The news feed did not respond." },
  es: { title: "Noticias", empty: "No hay noticias disponibles por ahora.", error: "El servicio de noticias no respondió." },
  tr: { title: "Haberler", empty: "Şu anda haber yok.", error: "Haber akışı yanıt vermedi." },
  ar: { title: "الأخبار", empty: "لا تتوفر أخبار الآن.", error: "لم يستجب موجز الأخبار." },
  zh: { title: "新闻", empty: "目前没有可用新闻。", error: "新闻源没有响应。" },
};

export function NewsView({
  lang,
  onScore,
  onStandings,
  onPlayoff,
  onCup,
  onSettings,
}: {
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onPlayoff: () => void;
  onCup: () => void;
  onSettings: () => void;
}) {
  const query = useQuery({
    queryKey: ["nba-news"],
    queryFn: () => getNews({ data: { refresh: false, lang: "en" } }),
    staleTime: 5 * 60_000,
  });
  const copy = COPY[lang];
  const articles = query.data?.ok ? query.data.articles : [];
  const failed = query.isError || (query.data != null && !query.data.ok);

  return (
    <main className="fixed inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-3xl px-3 pb-12 pt-4">
        <PageHeader
        active="news"
        title={copy.title}
        lang={lang}
        onScore={onScore}
        onStandings={onStandings}
        onNews={() => undefined}
        onPlayoff={onPlayoff}
        onCup={onCup}
        onSettings={onSettings}
      />

        {query.isLoading && (
          <div className="mt-5 flex flex-col gap-3" aria-label={t(lang, "loading")}>
            <div className="h-36 animate-pulse rounded-card bg-surface" />
            <div className="h-36 animate-pulse rounded-card bg-surface" />
            <div className="h-36 animate-pulse rounded-card bg-surface" />
          </div>
        )}
        {failed && (
          <div className="mt-5 rounded-card border border-line bg-surface p-5">
            <p>{copy.error}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-4 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink"
            >
              {t(lang, "retry")}
            </button>
          </div>
        )}
        {!query.isLoading && !failed && articles.length === 0 && (
          <p className="mt-5 rounded-card border border-line bg-surface p-5 text-muted">{copy.empty}</p>
        )}
        <ul className="mt-5 flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-accent sm:grid-cols-[10rem_1fr]"
              >
                {article.image && (
                  <img src={article.image} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-full" />
                )}
                <div className="p-4">
                  <p className="font-display text-2xl leading-tight">{article.headline}</p>
                  {article.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{article.description}</p>}
                  {formatPublished(article.published, localeFor(lang)) && <p className="mt-3 text-xs text-faint">{formatPublished(article.published, localeFor(lang))}</p>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function formatPublished(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
