import { Settings } from "lucide-react";
import { t, type Lang } from "@/lib/nba/i18n";

type Section = "score" | "standings" | "news" | "playoff";

const LABELS: Record<Lang, Record<Section, string>> = {
  fr: { score: "Scores", standings: "Classements", news: "Actualités", playoff: "Playoff" },
  en: { score: "Scores", standings: "Standings", news: "News", playoff: "Playoffs" },
  es: { score: "Resultados", standings: "Clasificación", news: "Noticias", playoff: "Playoff" },
  tr: { score: "Skorlar", standings: "Sıralama", news: "Haberler", playoff: "Playoff" },
  ar: { score: "النتائج", standings: "الترتيب", news: "الأخبار", playoff: "الأدوار الإقصائية" },
  zh: { score: "赛程", standings: "排名", news: "新闻", playoff: "季后赛" },
};

export function SectionNav({
  active,
  lang,
  onScore,
  onStandings,
  onNews,
  onPlayoff,
  onSettings,
}: {
  active: Section;
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onPlayoff: () => void;
  onSettings: () => void;
}) {
  const actions: { key: Section; onClick: () => void }[] = [
    { key: "score", onClick: onScore },
    { key: "standings", onClick: onStandings },
    { key: "news", onClick: onNews },
    { key: "playoff", onClick: onPlayoff },
  ];

  return (
    <nav aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"} className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
      {actions.filter(({ key }) => key !== active).map(({ key, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className="min-h-10 whitespace-nowrap rounded-full border border-line px-2.5 text-xs transition-colors hover:bg-surface sm:px-3 sm:text-sm"
        >
          {LABELS[lang][key]}
        </button>
      ))}
      <button
        type="button"
        onClick={onSettings}
        aria-label={t(lang, "settings")}
        title={t(lang, "settings")}
        className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition-colors hover:bg-surface"
      >
        <Settings aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
