import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatLocalTipWithDay, formatSlateDate, slateRelation, type SlateRelation } from "@/lib/nba/dates";
import { localeFor, phaseLabel, statusKey, t, type Lang } from "@/lib/nba/i18n";
import { presentGame, showResultsFor } from "@/lib/nba/present";
import type { GameCard, Slate } from "@/lib/nba/types";
import { IconButton, TeamMark } from "./ui";
import { PageHeader } from "./section-nav";

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
  onTeam,
  onStandings,
  onNews,
  onPlayoff,
  onCup,
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
  onTeam: (id: string) => void;
  onStandings: () => void;
  onNews: () => void;
  onPlayoff: () => void;
  onCup: () => void;
  onSettings: () => void;
}) {
  const locale = localeFor(lang);
  const relation = slateRelation(date);
  const start = useRef<{ x: number; y: number; top: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <section
      className="flex min-h-screen flex-col overflow-x-clip border-line lg:col-span-1 lg:border-e"
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
      <PageHeader
        active="score"
        lang={lang}
        onScore={() => undefined}
        onStandings={onStandings}
        onNews={onNews}
        onPlayoff={onPlayoff}
        onCup={onCup}
        onSettings={onSettings}
      >
        <div dir="ltr" className="flex items-end justify-between gap-2">
          <IconButton label={t(lang, "archiveSlate")} onClick={() => onShift(-1)}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <div className="min-w-0 flex-1 text-center" aria-live="polite">
            <p className="text-xs uppercase tracking-widest text-accent">{t(lang, RELATION[relation])}</p>
            <h2 className="truncate font-display text-4xl leading-none">{formatSlateDate(date, locale)}</h2>
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
      </PageHeader>
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
                onTeam={onTeam}
              />
            </li>
          ))}
        </ul>
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
  onTeam,
}: {
  game: GameCard;
  lang: Lang;
  locale: string;
  favorite: boolean;
  show: boolean;
  onOpen: () => void;
  onTeam: (id: string) => void;
}) {
  const view = presentGame(game, show);
  const national = game.nationalNames.slice(0, 2);
  const status = t(lang, statusKey(view.status, game.rawName));
  const period = livePeriod(game, lang);
  return (
    <div
      role="group"
      className={`w-full rounded-card border bg-surface p-4 text-start ${favorite ? "border-accent" : "border-line"}`}
    >
      <span className="sr-only">{t(lang, "openGame")}</span>
      <span dir="ltr" className="flex flex-col gap-3">
        <SideRow side={view.away} masked={!show && (game.status === "in" || game.status === "post")} hiddenLabel={t(lang, "scoreHidden")} onTeam={() => onTeam(game.away.id)} />
        <SideRow side={view.home} masked={!show && (game.status === "in" || game.status === "post")} hiddenLabel={t(lang, "scoreHidden")} onTeam={() => onTeam(game.home.id)} />
      </span>
      <button type="button" onClick={onOpen} className="mt-3 flex min-h-9 w-full items-center gap-2 text-start text-xs text-muted" aria-label={t(lang, "openGame")}>
        {favorite && <Star className="size-3.5 fill-current text-accent" aria-label={t(lang, "starLabel")} />}
        <span>{status}</span>
        {period && <span>{period}</span>}
        {view.status === "pre" && <span>{formatLocalTipWithDay(game.tipoff, locale)}</span>}
        {national.length > 0 && <span className="text-faint">{national.join(" · ")}</span>}
      </button>
    </div>
  );
}

function SideRow({ side, masked, hiddenLabel, onTeam }: { side: GameCard["home"]; masked: boolean; hiddenLabel: string; onTeam: () => void }) {
  return (
    <span className="flex items-center gap-3">
      <button type="button" onClick={onTeam} className="rounded-lg text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><TeamMark abbr={side.abbr} color={side.color} sources={[side.logo, side.logoAlt]} /><span className="sr-only">{side.name}</span></button>
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
