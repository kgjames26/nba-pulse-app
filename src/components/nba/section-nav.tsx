import { Settings } from "lucide-react";
import { t, type Lang } from "@/lib/nba/i18n";

type Section = "score" | "standings" | "news" | "playoff" | "cup";

const LABELS: Record<Lang, Record<Section, string>> = {
  fr: { score: "Scores", standings: "Classements", news: "Actualités", playoff: "Playoff", cup: "Cup" },
  en: { score: "Scores", standings: "Standings", news: "News", playoff: "Playoffs", cup: "Cup" },
  es: { score: "Resultados", standings: "Clasificación", news: "Noticias", playoff: "Playoff", cup: "Cup" },
  tr: { score: "Skorlar", standings: "Sıralama", news: "Haberler", playoff: "Playoff", cup: "Kupa" },
  ar: { score: "النتائج", standings: "الترتيب", news: "الأخبار", playoff: "الأدوار الإقصائية", cup: "الكأس" },
  zh: { score: "赛程", standings: "排名", news: "新闻", playoff: "季后赛", cup: "杯赛" },
};

export function SectionNav({
  active,
  lang,
  onScore,
  onStandings,
  onNews,
  onPlayoff,
  onCup,
  onSettings,
}: {
  active: Section;
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onPlayoff: () => void;
  onCup: () => void;
  onSettings: () => void;
}) {
  const actions: { key: Section; onClick: () => void }[] = [
    { key: "score", onClick: onScore },
    { key: "standings", onClick: onStandings },
    { key: "news", onClick: onNews },
    { key: "playoff", onClick: onPlayoff },
    { key: "cup", onClick: onCup },
  ];

  return (
    <nav aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"} className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
      {actions.map(({ key, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          aria-current={key === active ? "page" : undefined}
          tabIndex={key === active ? -1 : undefined}
          className={key === active ? "min-h-10 whitespace-nowrap rounded-full border-2 border-accent bg-accent px-2.5 text-sm font-bold text-accent-ink shadow-md shadow-accent/30 sm:px-3 sm:text-base" : "min-h-10 whitespace-nowrap rounded-full border border-line px-2.5 text-xs transition-colors hover:bg-surface sm:px-3 sm:text-sm"}
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
