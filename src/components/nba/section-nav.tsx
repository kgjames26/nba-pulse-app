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
}: {
  active: Section;
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onPlayoff: () => void;
  onCup: () => void;
}) {
  const actions: { key: Section; onClick: () => void }[] = [
    { key: "score", onClick: onScore },
    { key: "standings", onClick: onStandings },
    { key: "news", onClick: onNews },
    { key: "playoff", onClick: onPlayoff },
    { key: "cup", onClick: onCup },
  ];

  return (
    <nav aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"} className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-1 sm:justify-end sm:gap-1.5">
      {actions.map(({ key, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          aria-current={key === active ? "page" : undefined}
          tabIndex={key === active ? -1 : undefined}
          className={key === active ? "min-h-10 shrink-0 whitespace-nowrap rounded-full border-2 border-accent bg-accent px-2 text-xs font-extrabold text-accent-ink shadow-md shadow-accent/30 sm:min-h-11 sm:px-4 sm:text-base" : "min-h-10 shrink-0 whitespace-nowrap rounded-full border border-line px-1.5 text-[10px] transition-colors hover:bg-surface sm:px-3 sm:text-sm"}
        >
          {LABELS[lang][key]}
        </button>
      ))}

    </nav>
  );
}

export function SettingsButton({ lang, onClick }: { lang: Lang; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(lang, "settings")}
      title={t(lang, "settings")}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-accent bg-accent text-accent-ink shadow-md shadow-accent/30 transition-transform hover:scale-105"
    >
      <Settings aria-hidden="true" className="size-5" />
    </button>
  );
}
