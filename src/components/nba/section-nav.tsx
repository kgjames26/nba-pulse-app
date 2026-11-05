import { Settings } from "lucide-react";
import { t, type Lang } from "@/lib/nba/i18n";

type Section = "score" | "standings" | "news";

const LABELS: Record<Lang, Record<Section, string>> = {
  fr: { score: "Scores", standings: "Classements", news: "Actualités" },
  en: { score: "Scores", standings: "Standings", news: "News" },
  es: { score: "Resultados", standings: "Clasificación", news: "Noticias" },
  tr: { score: "Skorlar", standings: "Sıralama", news: "Haberler" },
  ar: { score: "النتائج", standings: "الترتيب", news: "الأخبار" },
  zh: { score: "赛程", standings: "排名", news: "新闻" },
};

export function SectionNav({
  active,
  lang,
  onScore,
  onStandings,
  onNews,
  onSettings,
}: {
  active: Section;
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onSettings: () => void;
}) {
  const actions: { key: Section; onClick: () => void }[] = [
    { key: "score", onClick: onScore },
    { key: "standings", onClick: onStandings },
    { key: "news", onClick: onNews },
  ];

  return (
    <nav aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"} className="flex items-center justify-end gap-2">
      {actions.filter(({ key }) => key !== active).map(({ key, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className="min-h-11 rounded-full border border-line px-3 text-sm transition-colors hover:bg-surface"
        >
          {LABELS[lang][key]}
        </button>
      ))}
      <button
        type="button"
        onClick={onSettings}
        aria-label={t(lang, "settings")}
        title={t(lang, "settings")}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-line transition-colors hover:bg-surface"
      >
        <Settings aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
