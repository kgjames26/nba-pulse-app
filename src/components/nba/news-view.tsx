import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNews } from "@/lib/nba/api";
import { LANGS, localeFor, t, type Lang } from "@/lib/nba/i18n";
import { PageHeader } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  source: string;
  empty: string;
  error: string;
  translate: string;
  translated: string;
  original: string;
  unavailable: string;
}> = {
  fr: {
    title: "Actualités", source: "Flux NBA · API ESPN", empty: "Aucune actualité disponible pour le moment.",
    error: "Le flux d’actualités n’a pas répondu.", translate: "Google Translate",
    translated: "Titres et résumés traduits automatiquement.", original: "Contenu original en anglais.",
    unavailable: "Traduction indisponible : configure la clé API Google côté serveur.",
  },
  en: {
    title: "News", source: "NBA feed · ESPN API", empty: "No news is available right now.",
    error: "The news feed did not respond.", translate: "Google Translate",
    translated: "Headlines and summaries translated automatically.", original: "Original English content.",
    unavailable: "Translation unavailable: configure the Google API key on the server.",
  },
  es: {
    title: "Noticias", source: "Flujo NBA · API ESPN", empty: "No hay noticias disponibles por ahora.",
    error: "El servicio de noticias no respondió.", translate: "Google Translate",
    translated: "Titulares y resúmenes traducidos automáticamente.", original: "Contenido original en inglés.",
    unavailable: "Traducción no disponible: configura la clave de Google en el servidor.",
  },
  tr: {
    title: "Haberler", source: "NBA akışı · ESPN API", empty: "Şu anda haber yok.",
    error: "Haber akışı yanıt vermedi.", translate: "Google Translate",
    translated: "Başlıklar ve özetler otomatik çevrildi.", original: "İngilizce orijinal içerik.",
    unavailable: "Çeviri kullanılamıyor: sunucuda Google API anahtarını yapılandır.",
  },
  ar: {
    title: "الأخبار", source: "موجز NBA · واجهة ESPN", empty: "لا تتوفر أخبار الآن.",
    error: "لم يستجب موجز الأخبار.", translate: "Google Translate",
    translated: "تُرجمت العناوين والملخصات تلقائيًا.", original: "المحتوى الأصلي باللغة الإنجليزية.",
    unavailable: "الترجمة غير متاحة: أضف مفتاح Google API إلى الخادم.",
  },
  zh: {
    title: "新闻", source: "NBA 资讯 · ESPN API", empty: "目前没有可用新闻。",
    error: "新闻源没有响应。", translate: "Google Translate",
    translated: "标题和摘要已自动翻译。", original: "英文原文。",
    unavailable: "翻译不可用：请在服务器配置 Google API 密钥。",
  },
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
  const [targetLang, setTargetLang] = useState<Lang>(lang);
  useEffect(() => setTargetLang(lang), [lang]);

  const query = useQuery({
    queryKey: ["nba-news", targetLang],
    queryFn: () => getNews({ data: { refresh: false, lang: targetLang } }),
    staleTime: 5 * 60_000,
  });
  const copy = COPY[lang];
  const articles = query.data?.ok ? query.data.articles : [];
  const failed = query.isError || (query.data != null && !query.data.ok);
  const translationStatus = query.data?.ok
    ? query.data.translation === "google"
      ? copy.translated
      : query.data.translation === "original"
        ? copy.original
        : copy.unavailable
    : "";

  return (
    <main className="fixed inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-3xl px-3 pb-12 pt-4">
        <PageHeader
        active="news"
        title={copy.title}
        subtitle={copy.source}
        lang={lang}
        onScore={onScore}
        onStandings={onStandings}
        onNews={() => undefined}
        onPlayoff={onPlayoff}
        onCup={onCup}
        onSettings={onSettings}
      />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3">
          <label htmlFor="nba-news-language" className="text-sm text-muted">{copy.translate}</label>
          <select
            id="nba-news-language"
            value={targetLang}
            onChange={(event) => setTargetLang(event.target.value as Lang)}
            className="min-h-10 rounded-full border border-line bg-surface px-3 text-sm"
          >
            {LANGS.map((item) => <option key={item.id} value={item.id}>{item.native}</option>)}
          </select>
          <p className="w-full text-xs text-faint" role="status" aria-live="polite">{translationStatus}</p>
        </div>

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
                  <p className="mt-3 text-xs text-faint">
                    {article.byline ? `${article.byline} · ` : ""}
                    {formatPublished(article.published, localeFor(lang)) || "ESPN"}
                  </p>
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
