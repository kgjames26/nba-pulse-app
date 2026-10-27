import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatSlateDate, formatTip, slateRelation, type SlateRelation } from "@/lib/nba/dates";
import { localeFor, phaseLabel, statusKey, t, type Lang } from "@/lib/nba/i18n";
import { presentGame, showResultsFor } from "@/lib/nba/present";
import type { GameCard, Slate } from "@/lib/nba/types";
import { IconButton, TeamMark } from "./ui";

const RELATION: Record<SlateRelation, "yesterday" | "todaySlate" | "upcomingSlate" | "archiveSlate"> = {
  yesterday: "yesterday",
  today: "todaySlate",
  upcoming: "upcomingSlate",
  archive: "archiveSlate",
};

export function SlateView({
  lang,
  date,
  slate,
  loading,
  error,
  favoriteIds,
  spoilers,
  revealedIds,
  onShift,
  onRetry,
  onOpen,
  onStandings,
  onSettings,
}: {
  lang: Lang;
  date: string;
  slate: Slate | null;
  loading: boolean;
  error: boolean;
  favoriteIds: string[];
  spoilers: boolean;
  revealedIds: string[];
  onShift: (delta: number) => void;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onStandings: () => void;
  onSettings: () => void;
}) {
  const locale = localeFor(lang);
  const relation = slateRelation(date);
  const start = useRef<{ x: number; y: number; top: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <section
      className="flex min-h-screen flex-col border-line lg:col-span-1 lg:border-e"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button, a, summary")) return;
        start.current = { x: event.clientX, y: event.clientY, top: scroller.current?.scrollTop ?? 0 };
      }}
      onPointerUp={(event) => {
        const origin = start.current;
        start.current = null;
        if (!origin) return;
        const dx = event.clientX - origin.x;
        const dy = event.clientY - origin.y;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          onShift(dx < 0 ? -1 : 1);
          return;
        }
        if (origin.top <= 2 && dy > 96 && dy > Math.abs(dx) * 1.4) onStandings();
      }}
    >
      <header className="sticky top-0 z-10 bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl tracking-wide">
            NBA <span className="text-accent">PULSE</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onStandings} className="min-h-11 rounded-full border border-line px-4 text-sm">
              {t(lang, "pullHint")}
            </button>
            <button type="button" onClick={onSettings} className="min-h-11 rounded-full border border-line px-4 text-sm">
              {t(lang, "settings")}
            </button>
          </div>
        </div>
        <div dir="ltr" className="mt-5 flex items-end justify-between gap-2">
          <IconButton label={t(lang, "archiveSlate")} onClick={() => onShift(-1)}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <div className="min-w-0 flex-1 text-center" aria-live="polite">
            <p className="text-xs uppercase tracking-widest text-accent">{t(lang, RELATION[relation])}</p>
            <h1 className="truncate font-display text-4xl leading-none">{formatSlateDate(date, locale)}</h1>
            {slate?.season && (
              <p className="mt-1 text-xs text-faint">
                {slate.season}
                {slate.phase ? ` · ${phaseLabel(slate.phase, lang)}` : ""}
              </p>
            )}
          </div>
          <IconButton label={t(lang, "upcomingSlate")} onClick={() => onShift(1)}>
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
        <p className="mt-3 text-center text-xs text-faint">{t(lang, "swipeHint")}</p>
      </header>
      <div ref={scroller} className="flex-1 px-4 pb-10">
        {loading && !slate && (
          <div className="flex flex-col gap-3" aria-hidden>
            <div className="h-28 animate-pulse rounded-card bg-surface" />
            <div className="h-28 animate-pulse rounded-card bg-surface" />
            <div className="h-28 animate-pulse rounded-card bg-surface" />
          </div>
        )}
        {error && (
          <div className="rounded-card border border-line bg-surface p-5">
            <p>{t(lang, "loadError")}</p>
            <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
              {t(lang, "retry")}
            </button>
          </div>
        )}
        {slate && slate.games.length === 0 && !error && (
          <p className="rounded-card border border-line bg-surface p-6 text-muted">{t(lang, "emptyDay")}</p>
        )}
        <ul className="flex flex-col gap-3">
          {slate?.games.map((game) => (
            <li key={game.id}>
              <GameRow
                game={game}
                lang={lang}
                locale={locale}
                favorite={favoriteIds.includes(game.home.id) || favoriteIds.includes(game.away.id)}
                show={showResultsFor(spoilers, revealedIds, game.id)}
                onOpen={() => onOpen(game.id)}
              />
            </li>
          ))}
        </ul>
        <details className="mt-6 text-sm text-muted">
          <summary className="min-h-11 cursor-pointer text-fg">{t(lang, "rankTitle")}</summary>
          <p className="mt-2">{t(lang, "rankBody")}</p>
        </details>
        {slate && <p className="mt-4 text-xs text-faint">{t(lang, "updated", { time: formatTip(slate.fetchedAt, locale) })}</p>}
        <p className="mt-6 text-xs text-faint">{t(lang, "noAccount")}</p>
      </div>
    </section>
  );
}

function GameRow({
  game,
  lang,
  locale,
  favorite,
  show,
  onOpen,
}: {
  game: GameCard;
  lang: Lang;
  locale: string;
  favorite: boolean;
  show: boolean;
  onOpen: () => void;
}) {
  const view = presentGame(game, show);
  const national = game.nationalNames.slice(0, 2);
  const status = t(lang, statusKey(view.status, game.rawName));
  const period = livePeriod(game, lang);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-card border bg-surface p-4 text-start ${favorite ? "border-accent" : "border-line"}`}
    >
      <span className="sr-only">{t(lang, "openGame")}</span>
      <span dir="ltr" className="flex flex-col gap-3">
        <SideRow side={view.away} masked={!show && (game.status === "in" || game.status === "post")} hiddenLabel={t(lang, "scoreHidden")} />
        <SideRow side={view.home} masked={!show && (game.status === "in" || game.status === "post")} hiddenLabel={t(lang, "scoreHidden")} />
      </span>
      <span className="mt-3 flex items-center gap-2 text-xs text-muted">
        {favorite && <Star className="size-3.5 fill-current text-accent" aria-label={t(lang, "starLabel")} />}
        <span>{status}</span>
        {period && <span>{period}</span>}
        {view.status === "pre" && <span>{formatTip(game.tipoff, locale)}</span>}
        {national.length > 0 && <span className="text-faint">{t(lang, "nationalTv")} · {national.join(" · ")}</span>}
      </span>
    </button>
  );
}

function SideRow({ side, masked, hiddenLabel }: { side: GameCard["home"]; masked: boolean; hiddenLabel: string }) {
  return (
    <span className="flex items-center gap-3">
      <TeamMark abbr={side.abbr} color={side.color} sources={[side.logo, side.logoAlt]} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl leading-none">{side.abbr}</span>
        <span className="block truncate text-sm text-muted">{side.name}</span>
      </span>
      {side.score != null ? (
        <span className={`font-display text-4xl tabular-nums leading-none ${side.winner ? "text-fg" : "text-muted"}`}>{side.score}</span>
      ) : masked ? (
        <span className="font-display text-3xl text-faint">
          <span className="sr-only">{hiddenLabel}</span>
          <span aria-hidden>—</span>
        </span>
      ) : null}
    </span>
  );
}

function livePeriod(game: GameCard, lang: Lang): string {
  if (game.period <= 0) return "";
  if (game.period > 4) {
    const extra = game.period - 4;
    return extra === 1 ? t(lang, "ot") : `${t(lang, "ot")} ${extra}`;
  }
  if (game.status === "in") return `Q${game.period}`;
  return "";
}
