import { Settings } from "lucide-react";
import type { ReactNode } from "react";
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

export function PageHeader({
  active,
  title,
  subtitle,
  lang,
  onScore,
  onStandings,
  onNews,
  onPlayoff,
  onCup,
  onSettings,
  children,
}: {
  active: Section;
  title?: string;
  subtitle?: string;
  lang: Lang;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onPlayoff: () => void;
  onCup: () => void;
  onSettings: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-3 border-b border-line bg-bg/95 px-3 pb-3 pt-4 backdrop-blur sm:-mx-4 sm:px-4">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="min-w-0 font-display text-2xl tracking-wide">
          NBA <span className="text-accent">PULSE</span>
        </p>
        <SettingsButton lang={lang} onClick={onSettings} />
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2">
        <h1 className="shrink-0 font-display text-3xl font-extrabold leading-none text-accent sm:text-4xl">
          {title ?? LABELS[lang][active]}
        </h1>
        <SectionNav
          active={active}
          lang={lang}
          onScore={onScore}
          onStandings={onStandings}
          onNews={onNews}
          onPlayoff={onPlayoff}
          onCup={onCup}
        />
      </div>
      {subtitle && <p className="mt-1 truncate text-xs uppercase tracking-widest text-muted">{subtitle}</p>}
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}

function SectionNav({
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
    <nav aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"} className="grid min-w-0 flex-1 grid-cols-5 gap-0.5 sm:gap-1">
      {actions.map(({ key, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          aria-current={key === active ? "page" : undefined}
          tabIndex={key === active ? -1 : undefined}
          className={key === active
            ? "flex min-h-10 min-w-0 items-center justify-center break-words rounded-full border-2 border-accent bg-accent px-0.5 py-1 text-center text-[8px] font-extrabold leading-tight text-accent-ink shadow-md shadow-accent/30 sm:px-1 sm:text-[10px] md:text-xs"
            : "flex min-h-10 min-w-0 items-center justify-center break-words rounded-full border border-line px-0.5 py-1 text-center text-[8px] leading-tight transition-colors hover:bg-surface sm:px-1 sm:text-[10px] md:text-xs"}
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
      className="grid size-6 shrink-0 place-items-center rounded-full border border-accent bg-accent text-accent-ink shadow-sm shadow-accent/40"
    >
      <Settings aria-hidden="true" className="size-4 stroke-[2.5]" />
    </button>
  );
}
