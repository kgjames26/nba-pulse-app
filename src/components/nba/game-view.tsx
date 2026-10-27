import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Lock } from "lucide-react";
import { statReading } from "@/lib/nba/bundle";
import { formatTip } from "@/lib/nba/dates";
import { getGame, getNarrative } from "@/lib/nba/api";
import { localeFor, statusKey, t, type Lang } from "@/lib/nba/i18n";
import { percentPair } from "@/lib/nba/odds";
import { presentGame, resultsAreHidden } from "@/lib/nba/present";
import { sourceHost } from "@/lib/nba/tactic";
import type { GameCard, GameDetail, PlayerLine, Tactic } from "@/lib/nba/types";
import { PrimaryButton, TeamMark } from "./ui";

const BOX_EMPTY: Record<Lang, string> = {
  fr: "Le flux n'a pas fourni de feuille de stats.",
  en: "The feed did not include a box score.",
  es: "La fuente no trae hoja de estadísticas.",
  tr: "Akış istatistik tablosu vermedi.",
  ar: "التغذية لا تتضمن إحصاءات اللاعبين.",
  zh: "数据源没有提供技术统计。",
};

export function GameView({
  id,
  lang,
  show,
  onBack,
  onReveal,
}: {
  id: string;
  lang: Lang;
  show: boolean;
  onBack: () => void;
  onReveal: () => void;
}) {
  const locale = localeFor(lang);
  const query = useQuery({
    queryKey: ["game", id],
    queryFn: () => getGame({ data: { id } }),
  });
  const detail = query.data?.ok ? query.data.detail : null;
  const game = detail?.game;
  const hidden = game ? resultsAreHidden(game.status, show) : false;
  const kind = game?.status === "post" ? "recap" : game?.status === "pre" ? "duels" : null;
  const narrative = useQuery({
    queryKey: ["narrative", "tactic", id, lang, kind],
    enabled: Boolean(kind) && (kind === "duels" || show),
    retry: false,
    staleTime: kind === "recap" ? Infinity : 3 * 60 * 60 * 1000,
    queryFn: () => getNarrative({ data: { id, lang, kind: kind! } }),
  });

  return (
    <article className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-bg/95 px-3 py-3 backdrop-blur lg:px-6">
        <button type="button" onClick={onBack} className="grid size-11 place-items-center rounded-full border border-line lg:hidden">
          <ChevronLeft className="size-5 rtl:rotate-180" />
          <span className="sr-only">{t(lang, "back")}</span>
        </button>
        <p className="font-display text-xl tracking-wide">
          NBA <span className="text-accent">PULSE</span>
        </p>
      </header>
      <div className="px-4 pb-16 lg:px-6">
        {query.isLoading && <div className="h-40 animate-pulse rounded-card bg-surface" />}
        {query.data && !query.data.ok && (
          <div className="rounded-card border border-line p-5">
            <p>{t(lang, "loadError")}</p>
            <button type="button" onClick={() => void query.refetch()} className="mt-4 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
              {t(lang, "retry")}
            </button>
          </div>
        )}
        {detail && game && (
          <div className="rise">
            <Result
              game={game}
              show={show}
              lang={lang}
              locale={locale}
              attendance={show ? detail.attendance : null}
            />
            {hidden && (
              <div className="mt-4">
                <PrimaryButton onClick={onReveal}>{t(lang, "reveal")}</PrimaryButton>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Lock className="size-4" aria-hidden />
                  {t(lang, "scoreHidden")}
                </p>
              </div>
            )}
            {!hidden && game.status !== "pre" && (
              <>
                <Lines game={presentGame(game, true)} lang={lang} />
                <Box detailTeams={detail.box} game={game} lang={lang} />
                <Recap
                  lang={lang}
                  stat={statReading(lang, detail)}
                  desk={narrative.data?.mode === "desk" ? narrative.data.text : ""}
                  tactic={narrative.data?.mode === "desk" ? narrative.data.tactic ?? null : null}
                  pending={game.status !== "post"}
                  tried={narrative.isFetched}
                  fetching={narrative.isFetching}
                />
                <Clips clips={detail.clips} lang={lang} />
              </>
            )}
            {game.status === "pre" && (
              <>
                <Odds detail={detail} lang={lang} locale={locale} />
                <Duels
                  lang={lang}
                  stat={statReading(lang, detail)}
                  desk={narrative.data?.mode === "desk" ? narrative.data.duels : []}
                  tried={narrative.isFetched}
                />
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Result({
  game,
  show,
  lang,
  locale,
  attendance,
}: {
  game: GameCard;
  show: boolean;
  lang: Lang;
  locale: string;
  attendance: number | null;
}) {
  const view = presentGame(game, show);
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-widest text-accent">{t(lang, statusKey(game.status, game.rawName))}</p>
      <div dir="ltr" className="mt-4 flex flex-col gap-4">
        <ScoreRow side={view.away} masked={resultsAreHidden(game.status, show)} hiddenLabel={t(lang, "scoreHidden")} />
        <ScoreRow side={view.home} masked={resultsAreHidden(game.status, show)} hiddenLabel={t(lang, "scoreHidden")} />
      </div>
      <p className="mt-4 text-sm text-muted">
        {game.status === "pre" ? formatTip(game.tipoff, locale) : formatTip(game.tipoff, locale)}
        {game.venue ? ` · ${game.venue}` : ""}
      </p>
      {attendance != null && <p className="mt-1 text-sm text-faint">{t(lang, "attendanceLabel", { n: attendance })}</p>}
    </section>
  );
}

function ScoreRow({ side, masked, hiddenLabel }: { side: GameCard["home"]; masked: boolean; hiddenLabel: string }) {
  return (
    <div className="flex items-center gap-3">
      <TeamMark abbr={side.abbr} color={side.color} sources={[side.logo, side.logoAlt]} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-3xl leading-none">{side.abbr}</p>
        <p className="truncate text-sm text-muted">{side.name}</p>
      </div>
      {side.score != null ? (
        <p className={`font-display text-5xl tabular-nums leading-none ${side.winner ? "text-fg" : "text-muted"}`}>{side.score}</p>
      ) : masked ? (
        <p className="font-display text-4xl text-faint">
          <span className="sr-only">{hiddenLabel}</span>
          <span aria-hidden>—</span>
        </p>
      ) : null}
    </div>
  );
}

function Lines({ game, lang }: { game: GameCard; lang: Lang }) {
  const count = Math.max(game.away.lines.length, game.home.lines.length);
  if (count < 4) return null;
  const labels = Array.from({ length: count }, (_, index) => (index < 4 ? `Q${index + 1}` : index === 4 ? t(lang, "ot") : `${t(lang, "ot")}${index - 3}`));
  return (
    <section dir="ltr" className="mt-4 overflow-x-auto rounded-card border border-line">
      <table className="w-full text-sm tabular-nums">
        <thead className="text-faint">
          <tr>
            <th className="px-3 py-2 text-start font-medium" />
            {labels.map((label) => (
              <th key={label} className="px-2 py-2 text-center font-medium">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[game.away, game.home].map((side) => (
            <tr key={side.id} className="border-t border-line">
              <th className="px-3 py-2 text-start font-display text-lg font-medium">{side.abbr}</th>
              {labels.map((_, index) => (
                <td key={index} className="px-2 py-2 text-center">{side.lines[index] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Box({
  detailTeams,
  game,
  lang,
}: {
  detailTeams: { teamId: string; players: PlayerLine[] }[];
  game: GameCard;
  lang: Lang;
}) {
  const order = [game.away, game.home];
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{t(lang, "box")}</h2>
      <p className="mt-1 text-xs text-faint">{t(lang, "boxScroll")}</p>
      {detailTeams.length === 0 && <p className="mt-3 text-sm text-muted">{BOX_EMPTY[lang]}</p>}
      <div className="mt-3 flex gap-2">
        {order.map((side) => (
          <a key={side.id} href={`#box-${side.id}`} className="min-h-11 rounded-full border border-line px-4 py-2 text-sm">
            {side.abbr}
          </a>
        ))}
      </div>
      {order.map((side) => {
        const group = detailTeams.find((item) => item.teamId === side.id);
        if (!group) return null;
        const top = group.players.reduce((best, player) => {
          const pts = Number(player.pts);
          if (!Number.isFinite(pts)) return best;
          return pts > best ? pts : best;
        }, -1);
        return (
          <div key={side.id} id={`box-${side.id}`} className="mt-4 overflow-x-auto rounded-card border border-line">
            <p className="px-3 pt-3 font-display text-xl">{side.name}</p>
            <table className="mt-2 w-full min-w-max text-left text-sm tabular-nums">
              <thead className="text-xs text-faint">
                <tr>
                  {["", "MIN", "PTS", "REB", "AST", "STL", "BLK", "FG", "3PT", "FT", "+/-"].map((label) => (
                    <th key={label || "player"} className={`px-2 py-2 font-medium ${label === "" ? "sticky start-0 bg-bg" : ""}`}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.players.map((player) => {
                  const hot = !player.dnp && Number(player.pts) === top && top >= 0;
                  return (
                    <tr key={player.id || player.name} className="border-t border-line">
                      <th className={`sticky start-0 bg-bg px-2 py-2 text-start font-medium ${hot ? "text-accent" : ""}`}>
                        <span className="block text-fg">{player.name}</span>
                        <span className="block text-xs font-normal text-faint">
                          {player.pos}
                          {player.dnp ? ` · ${t(lang, "dnp")}${player.reason ? ` · ${player.reason}` : ""}` : ""}
                        </span>
                      </th>
                      {[player.min, player.pts, player.reb, player.ast, player.stl, player.blk, player.fg, player.tp, player.ft, player.pm].map((value, index) => (
                        <td key={index} className="px-2 py-2">{player.dnp ? "—" : value}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}

function Recap({
  lang,
  stat,
  desk,
  tactic,
  pending,
  tried,
  fetching,
}: {
  lang: Lang;
  stat: ReturnType<typeof statReading>;
  desk: string;
  tactic: Tactic | null;
  pending: boolean;
  tried: boolean;
  fetching: boolean;
}) {
  const sourced = Boolean(tactic && tactic.worked && tactic.failed && tactic.sources.length);
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{t(lang, "recap")}</h2>
      {pending && <p className="mt-3 text-sm text-muted">{t(lang, "comingSoonRecap")}</p>}
      {!pending && (
        <>
          <p className="mt-2 text-xs uppercase tracking-widest text-accent">
            {sourced ? t(lang, "tacticLabel") : desk ? t(lang, "deskLabel") : t(lang, "statLabel")}
          </p>
          {sourced && <p className="mt-2 text-sm text-muted">{t(lang, "tacticByline")}</p>}
          {fetching && !sourced && <p className="mt-2 text-sm text-muted">{t(lang, "tacticPending")}</p>}
          {stat.scoreLine && <p dir="ltr" className="mt-3 font-display text-2xl">{stat.scoreLine}</p>}
          {sourced && tactic ? (
            <>
              {tactic.lead && <p className="mt-3 text-base leading-relaxed">{tactic.lead}</p>}
              <div className="mt-4 flex flex-col gap-3">
                <article className="rounded-card border border-line bg-surface p-4">
                  <p className="text-xs uppercase tracking-widest text-accent">{t(lang, "workedKicker")}</p>
                  <h3 dir="ltr" className="mt-1 font-display text-2xl">{tactic.winner}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{tactic.worked}</p>
                </article>
                <article className="rounded-card border border-line bg-surface p-4">
                  <p className="text-xs uppercase tracking-widest text-muted">{t(lang, "failedKicker")}</p>
                  <h3 dir="ltr" className="mt-1 font-display text-2xl">{tactic.loser}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{tactic.failed}</p>
                </article>
              </div>
              <h3 className="mt-5 text-xs uppercase tracking-widest text-faint">{t(lang, "sourcesLabel")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {tactic.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-line bg-raised px-3 py-3">
                      <span className="block text-sm text-fg">{source.title}</span>
                      <span dir="ltr" className="mt-1 block text-xs text-faint">{sourceHost(source.url)}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-faint">{t(lang, "tacticDisclaimer")}</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-base leading-relaxed">{desk || stat.text}</p>
              <p className="mt-3 text-xs text-faint">{t(lang, "sourceFeed")}</p>
              {tried && !desk && !fetching && <p className="mt-1 text-xs text-faint">{t(lang, "noAi")}</p>}
            </>
          )}
        </>
      )}
    </section>
  );
}

function Clips({ clips, lang }: { clips: { id: string; title: string; thumbnail: string; url: string; duration: number; player: string | null; kind: "play" | "package" }[]; lang: Lang }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{t(lang, "clips")}</h2>
      <p className="mt-2 text-sm text-muted">{t(lang, "clipsNote")}</p>
      {clips.length === 0 && <p className="mt-3 text-sm text-muted">{t(lang, "clipsNone")}</p>}
      <ul className="mt-4 flex flex-col gap-3">
        {clips.map((clip) => (
          <li key={clip.id}>
            <a href={clip.url} target="_blank" rel="noreferrer" className="flex gap-3 rounded-card border border-line bg-surface p-3">
              {clip.thumbnail ? (
                <img src={clip.thumbnail} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-20 w-32 shrink-0 place-items-center rounded-xl bg-raised text-xs text-faint">{t(lang, "watch")}</span>
              )}
              <span className="min-w-0">
                <span className="block text-sm text-fg">{clip.title}</span>
                <span className="mt-1 block text-xs text-faint">
                  {clip.kind === "package" ? t(lang, "clipsPackage") : clip.player}
                  {clip.duration > 0 ? ` · ${formatDuration(clip.duration)}` : ""}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Odds({ detail, lang, locale }: { detail: GameDetail; lang: Lang; locale: string }) {
  const odds = detail.odds;
  const game = detail.game;
  const pair = odds ? percentPair(odds.homeProb, odds.awayProb) : null;
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{t(lang, "odds")}</h2>
      {!odds || !pair ? (
        <p className="mt-3 text-sm text-muted">{t(lang, "oddsNone")}</p>
      ) : (
        <div dir="ltr" className="mt-3 rounded-card border border-line bg-surface p-4">
          <div className="grid grid-cols-2 gap-3">
            <Prob name={game.away.abbr} value={pair.away} color={game.away.color} />
            <Prob name={game.home.abbr} value={pair.home} color={game.home.color} />
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-raised">
            <div style={{ width: `${pair.away}%`, background: game.away.color }} />
            <div style={{ width: `${pair.home}%`, background: game.home.color }} />
          </div>
          <p className="mt-3 text-xs text-faint">{t(lang, "providerLine", { name: odds.provider })}</p>
          <p className="mt-1 text-xs text-faint">{t(lang, "oddsAsOf", { time: formatTip(detail.fetchedAt, locale) })}</p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">{t(lang, "oddsNote")}</p>
    </section>
  );
}

function Prob({ name, value, color }: { name: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{name}</p>
      <p className="font-display text-5xl tabular-nums leading-none" style={{ color }}>{value}%</p>
    </div>
  );
}

function Duels({
  lang,
  stat,
  desk,
  tried,
}: {
  lang: Lang;
  stat: ReturnType<typeof statReading>;
  desk: { title: string; body: string }[];
  tried: boolean;
}) {
  const duels = desk.length ? desk : stat.duels;
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{t(lang, "duels")}</h2>
      <p className="mt-1 text-xs uppercase tracking-widest text-accent">{desk.length ? t(lang, "deskLabel") : t(lang, "statLabel")}</p>
      <p className="mt-2 text-sm text-muted">{t(lang, "duelNote")}</p>
      {duels.length === 0 && <p className="mt-3 text-sm text-muted">{t(lang, "duelNote")}</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {duels.map((duel) => (
          <li key={duel.title + duel.body.slice(0, 24)} className="rounded-card border border-line bg-surface p-4">
            <p className="font-display text-xl text-accent">{duel.title}</p>
            <p className="mt-2 text-sm leading-relaxed">{duel.body}</p>
          </li>
        ))}
      </ul>
      {stat.absences && <p className="mt-3 text-sm text-muted">{stat.absences}</p>}
      {tried && desk.length === 0 && <p className="mt-2 text-xs text-faint">{t(lang, "noAi")}</p>}
    </section>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
