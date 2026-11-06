import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { formatTip } from "@/lib/nba/dates";
import { getCup } from "@/lib/nba/api";
import { localeFor, t, type Lang } from "@/lib/nba/i18n";
import type { CupGame, CupGroup, CupTeamStanding } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";
import { PageHeader } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  groupPlay: string;
  group: string;
  team: string;
  record: string;
  diff: string;
  played: string;
  wildCard: string;
  wildcardRace: string;
  knockout: string;
  quarterfinals: string;
  semifinals: string;
  final: string;
  undecided: string;
  schedule: string;
  noGames: string;
}> = {
  fr: { title: "NBA Cup", groupPlay: "Phase de groupes", group: "Groupe", team: "Équipe", record: "Bilan", diff: "+/−", played: "MJ", wildCard: "Meilleur deuxième", wildcardRace: "Places qualificatives", knockout: "Phase finale", quarterfinals: "Quarts de finale", semifinals: "Demi-finales", final: "Finale NBA Cup", undecided: "À déterminer", schedule: "Matchs de la Cup", noGames: "Aucun match de groupe trouvé pour cette conférence." },
  en: { title: "NBA Cup", groupPlay: "Group play", group: "Group", team: "Team", record: "Record", diff: "+/−", played: "GP", wildCard: "Best runner-up", wildcardRace: "Qualifying places", knockout: "Knockout stage", quarterfinals: "Quarterfinals", semifinals: "Semifinals", final: "NBA Cup Final", undecided: "To be determined", schedule: "Cup games", noGames: "No group games found for this conference." },
  es: { title: "NBA Cup", groupPlay: "Fase de grupos", group: "Grupo", team: "Equipo", record: "Récord", diff: "+/−", played: "PJ", wildCard: "Mejor segundo", wildcardRace: "Plazas clasificatorias", knockout: "Eliminatorias", quarterfinals: "Cuartos de final", semifinals: "Semifinales", final: "Final de la NBA Cup", undecided: "Por determinar", schedule: "Partidos de la Cup", noGames: "No se encontraron partidos de grupo para esta conferencia." },
  tr: { title: "NBA Cup", groupPlay: "Grup aşaması", group: "Grup", team: "Takım", record: "Galibiyet–mağlubiyet", diff: "+/−", played: "O", wildCard: "En iyi ikinci", wildcardRace: "Sıralama", knockout: "Eleme aşaması", quarterfinals: "Çeyrek finaller", semifinals: "Yarı finaller", final: "NBA Cup Finali", undecided: "Belirlenecek", schedule: "Cup maçları", noGames: "Bu konferans için grup maçı bulunamadı." },
  ar: { title: "كأس NBA", groupPlay: "دور المجموعات", group: "المجموعة", team: "الفريق", record: "السجل", diff: "+/−", played: "لعب", wildCard: "أفضل وصيف", wildcardRace: "مراكز التأهل", knockout: "الأدوار الإقصائية", quarterfinals: "ربع النهائي", semifinals: "نصف النهائي", final: "نهائي كأس NBA", undecided: "يُحدد لاحقًا", schedule: "مباريات الكأس", noGames: "لا توجد مباريات مجموعات لهذا المؤتمر." },
  zh: { title: "NBA 杯", groupPlay: "小组赛", group: "组", team: "球队", record: "胜负", diff: "+/−", played: "场", wildCard: "最佳小组第二", wildcardRace: "晋级席位", knockout: "淘汰赛", quarterfinals: "四分之一决赛", semifinals: "半决赛", final: "NBA 杯决赛", undecided: "待定", schedule: "杯赛", noGames: "该分区暂无小组赛。" },
};

export function CupView({ lang, open, canSee, onUnlock, onScore, onStandings, onNews, onPlayoff, onSettings }: {
  lang: Lang; open: boolean; canSee: boolean; onUnlock: () => void; onScore: () => void;
  onStandings: () => void; onNews: () => void; onPlayoff: () => void; onSettings: () => void;
}) {
  const [conference, setConference] = useState<"east" | "west">("east");
  const now = new Date();
  const seasonYear = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const query = useQuery({ queryKey: ["nba-cup", seasonYear], enabled: open && canSee, staleTime: 45_000,
    queryFn: () => getCup({ data: { seasonYear } }) });
  if (!open) return null;
  const copy = COPY[lang];
  const locale = localeFor(lang);
  const cup = query.data?.ok ? query.data.cup : null;
  const groups = cup?.groups.filter((group) => group.conference === conference) ?? [];
  const games = cup?.games.filter((item) => item.stage === "group" && item.conference === conference) ?? [];
  const runnersUp = groups.map((group) => group.teams[1]).filter((team): team is CupTeamStanding => Boolean(team && team.played > 0));
  const groupWinners = groups.map((group) => group.teams[0]).filter((team): team is CupTeamStanding => Boolean(team && team.played > 0));
  const rankedWinners = [...groupWinners].sort(compareCupTeams);
  const wildcard = [...runnersUp].sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff || b.pointsFor - a.pointsFor)[0];
  const projectedQuarterfinals: CupPair[] = rankedWinners.length === 3 && wildcard
    ? [{ left: rankedWinners[0], right: wildcard }, { left: rankedWinners[1], right: rankedWinners[2] }]
    : [];
  const schedule = games.filter((item) => item.game.status === "pre" || item.game.status === "in").slice(0, 5);
  const recent = games.filter((item) => item.game.status === "post").slice(-5).reverse();
  const shownGames = schedule.length ? schedule : recent;

  return <main className="fixed inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg">
    <div className="mx-auto min-h-screen max-w-6xl px-3 pb-12 pt-4">
      <PageHeader
        active="cup"
        title={copy.title}
        lang={lang}
        onScore={onScore}
        onStandings={onStandings}
        onNews={onNews}
        onPlayoff={onPlayoff}
        onCup={() => undefined}
        onSettings={onSettings}
      />
      {!canSee ? <div className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-surface p-5">
        <p className="font-display text-3xl">{t(lang, "standLockTitle")}</p><p className="mt-3 text-sm text-muted">{t(lang, "standLockBody")}</p>
        <div className="mt-5"><PrimaryButton onClick={onUnlock}>{t(lang, "standReveal")}</PrimaryButton></div>
      </div> : <>
        <div className="mt-5 flex gap-2 sm:max-w-sm">{(["east", "west"] as const).map((key) =>
          <button key={key} type="button" onClick={() => setConference(key)} aria-pressed={conference === key}
            className={conference === key ? "min-h-11 flex-1 rounded-full bg-accent text-sm text-accent-ink" : "min-h-11 flex-1 rounded-full border border-line text-sm"}>{t(lang, key)}</button>)}</div>
        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-2"><div><h2 className="font-display text-2xl">{copy.groupPlay}</h2><p className="text-xs text-faint">{cup?.season ?? seasonYear + "-" + String(seasonYear + 1).slice(-2)}</p></div></div>
          {query.isLoading && <div className="h-36 animate-pulse rounded-card bg-surface" />}
          {query.data && !query.data.ok && <div className="rounded-card border border-line bg-surface p-4"><p>{t(lang, "loadError")}</p><button type="button" onClick={() => void query.refetch()} className="mt-3 min-h-10 rounded-full bg-accent px-4 text-sm text-accent-ink">{t(lang, "retry")}</button></div>}
          {cup && <div dir="ltr" className="grid gap-3 lg:grid-cols-3">{groups.map((group) => <GroupTable key={group.name} group={group} copy={copy} />)}</div>}
        </section>
        {cup && <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-card border border-line bg-surface p-4 sm:p-5"><h2 className="font-display text-2xl">{copy.wildcardRace}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {groups.map((group) => <Qualifier key={group.name} label={copy.group + " " + group.name} team={group.teams[0]?.played ? group.teams[0] : undefined} />)}
              <Qualifier label={copy.wildCard} team={wildcard} />
            </div>
          </section><Knockout copy={copy} games={cup.games.filter((item) => item.stage !== "group")} groups={cup.groups} conference={conference} locale={locale} projectedQuarterfinals={projectedQuarterfinals} />
        </div>}
        {cup && <section className="mt-5 rounded-card border border-line bg-surface p-4 sm:p-5"><h2 className="font-display text-2xl">{copy.schedule}</h2>
          {shownGames.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{shownGames.map(({ game, group }) => <li key={game.id} className="flex items-center gap-2 rounded-2xl border border-line bg-bg px-3 py-3">
            <span className="w-14 shrink-0 text-[10px] text-faint">{formatTip(game.tipoff, locale)}</span><TeamMark abbr={game.away.abbr} color={UNKNOWN_COLOR} sources={[game.away.logo]} />
            <span className="min-w-0 flex-1 truncate text-xs">{game.away.short}</span><span dir="ltr" className="font-display text-lg tabular-nums">{game.status === "pre" ? "—" : (game.away.score ?? "—") + "–" + (game.home.score ?? "—")}</span>
            <span className="min-w-0 flex-1 truncate text-right text-xs">{game.home.short}</span><TeamMark abbr={game.home.abbr} color={UNKNOWN_COLOR} sources={[game.home.logo]} /><span className="sr-only">{copy.group} {group}</span>
          </li>)}</ul> : <p className="mt-3 text-sm text-muted">{copy.noGames}</p>}
        </section>}
      </>}
    </div>
  </main>;
}

function GroupTable({ group, copy }: { group: CupGroup; copy: typeof COPY[Lang] }) {
  return <section className="overflow-hidden rounded-card border border-line bg-surface">
    <div className="flex items-center border-b border-line px-4 py-3"><h3 className="font-display text-xl">{copy.group} {group.name}</h3></div>
    <div className="grid grid-cols-[minmax(0,1fr)_2.2rem_3.3rem_2.7rem] gap-1 px-3 py-2 text-[10px] uppercase tracking-wider text-faint"><span>{copy.team}</span><span className="text-center">{copy.played}</span><span className="text-center">{copy.record}</span><span className="text-center">{copy.diff}</span></div>
    <ol className="divide-y divide-line">{group.teams.map((team,index) => <li key={team.id} className="grid grid-cols-[minmax(0,1fr)_2.2rem_3.3rem_2.7rem] items-center gap-1 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2"><span className="w-4 shrink-0 text-xs text-faint">{index+1}</span><TeamMark abbr={team.abbr} color={UNKNOWN_COLOR} sources={[team.logo]} /><span className="truncate text-xs">{team.name}</span></span>
      <span className="text-center text-xs tabular-nums">{team.played}</span><span className="text-center text-xs tabular-nums">{team.wins}–{team.losses}</span>
      <span className={team.pointDiff > 0 ? "text-center text-xs text-emerald-200" : team.pointDiff < 0 ? "text-center text-xs text-rose-200" : "text-center text-xs text-faint"}>{team.pointDiff > 0 ? "+" : ""}{team.pointDiff}</span>
    </li>)}</ol>
  </section>;
}
function Qualifier({ label, team }: { label: string; team?: CupTeamStanding }) {
  return <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-bg p-3">
    {team ? <TeamMark abbr={team.abbr} color={UNKNOWN_COLOR} sources={[team.logo]} /> : <span className="size-9 rounded-full border border-dashed border-line" />}
    <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-accent">{label}</span><span className="block truncate text-sm">{team?.name ?? "—"}</span>
      {team && <span className="text-xs text-faint">{team.wins}–{team.losses} · {team.pointDiff > 0 ? "+" : ""}{team.pointDiff}</span>}</span>
  </div>;
}
type CupPair = { left?: CupTeamStanding; right?: CupTeamStanding };

function compareCupTeams(a: CupTeamStanding, b: CupTeamStanding): number {
  return b.wins - a.wins || b.pointDiff - a.pointDiff || b.pointsFor - a.pointsFor || a.name.localeCompare(b.name);
}

function gameWinner(item: CupGame, groups: CupGroup[]): CupTeamStanding | undefined {
  const game = item.game;
  if (game.status !== "post" || game.home.score == null || game.away.score == null) return undefined;
  const winnerId = game.home.winner || game.home.score > game.away.score ? game.home.id : game.away.id;
  return groups.flatMap((group) => group.teams).find((team) => team.id === winnerId);
}

function Knockout({ copy, games, groups, conference, locale, projectedQuarterfinals }: {
  copy: typeof COPY[Lang]; games: CupGame[]; groups: CupGroup[]; conference: "east" | "west";
  locale: string; projectedQuarterfinals: CupPair[];
}) {
  const quarterfinals = games.filter((item) => item.stage === "quarterfinal" && item.conference === conference);
  const semifinals = games.filter((item) => item.stage === "semifinal" && item.conference === conference);
  const finals = games.filter((item) => item.stage === "final");
  const qfWinners = quarterfinals.map((item) => gameWinner(item, groups)).filter((team): team is CupTeamStanding => Boolean(team));
  const semiProjection: CupPair[] = qfWinners.length ? [{ left: qfWinners[0], right: qfWinners[1] }] : [];
  const semiWinners = games.map((item) => ({
    conference: item.conference,
    winner: item.stage === "semifinal" ? gameWinner(item, groups) : undefined,
  })).filter((item): item is { conference: "east" | "west" | "both"; winner: CupTeamStanding } => Boolean(item.winner));
  const eastWinner = semiWinners.find((item) => item.conference === "east")?.winner;
  const westWinner = semiWinners.find((item) => item.conference === "west")?.winner;
  const finalProjection: CupPair[] = eastWinner || westWinner ? [{ left: eastWinner, right: westWinner }] : [];

  return <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
    <h2 className="font-display text-2xl">{copy.knockout}</h2>
    <div className="mt-3 grid gap-3">
      <RoundCard title={copy.quarterfinals} games={quarterfinals} projected={projectedQuarterfinals} slots={2} locale={locale} undecided={copy.undecided} tone="cyan" />
      <RoundCard title={copy.semifinals} games={semifinals} projected={semiProjection} slots={1} locale={locale} undecided={copy.undecided} tone="violet" />
      <RoundCard title={copy.final} games={finals} projected={finalProjection} slots={1} locale={locale} undecided={copy.undecided} tone="fuchsia" trophy />
    </div>
  </section>;
}

function RoundCard({ title, games, projected, slots, locale, undecided, tone, trophy = false }: {
  title: string; games: CupGame[]; projected: CupPair[]; slots: number;
  locale: string; undecided: string; tone: "cyan" | "violet" | "fuchsia"; trophy?: boolean;
}) {
  const color = tone === "cyan" ? "border-cyan-400/30 bg-cyan-400/[0.035] text-cyan-100"
    : tone === "violet" ? "border-violet-400/30 bg-violet-400/[0.035] text-violet-100"
    : "border-fuchsia-400/30 bg-fuchsia-400/[0.035] text-fuchsia-100";
  const dates = Array.from(new Set(games.map((item) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(item.game.tipoff)))));
  const dateLabel = dates.length ? dates.join(" · ") : undecided;
  const shown = games.slice(0, slots);
  const useProjection = shown.length === 0 && projected.length > 0;
  const emptySlots = Math.max(0, slots - (shown.length || (useProjection ? projected.length : 0)));
  return <section className={"rounded-2xl border p-3 " + color}>
    <div className="flex items-center gap-2">
      {trophy && <Trophy aria-hidden="true" className="size-5 shrink-0" />}
      <h3 className="min-w-0 flex-1 font-display text-lg">{title}</h3>
      <span className="text-xs opacity-75">{dateLabel}</span>
    </div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {shown.map((item) => <CupMatch key={item.game.id} item={item} />)}
      {useProjection && projected.slice(0, slots).map((pair, index) =>
        <ProjectedMatch key={"projected-" + index} pair={pair} undecided={undecided} />
      )}
      {Array.from({ length: emptySlots }, (_, index) => <SlotMatch key={"tbd-" + index} undecided={undecided} />)}
    </div>
  </section>;
}

function CupMatch({ item }: { item: CupGame }) {
  const { game } = item;
  const score = game.status === "pre" ? "—" : (game.away.score ?? "—") + "–" + (game.home.score ?? "—");
  return <article className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-bg px-3 py-3">
    <TeamMark abbr={game.away.abbr} color={UNKNOWN_COLOR} sources={[game.away.logo]} />
    <span className="min-w-0 flex-1 truncate text-xs">{game.away.short}</span>
    <span dir="ltr" className="shrink-0 font-display text-xl tabular-nums">{score}</span>
    <span className="min-w-0 flex-1 truncate text-right text-xs">{game.home.short}</span>
    <TeamMark abbr={game.home.abbr} color={UNKNOWN_COLOR} sources={[game.home.logo]} />
  </article>;
}

function ProjectedMatch({ pair, undecided }: { pair: CupPair; undecided: string }) {
  return <article className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-bg px-3 py-3">
    <ProjectedTeam team={pair.left} undecided={undecided} />
    <span dir="ltr" className="shrink-0 font-display text-lg">vs</span>
    <ProjectedTeam team={pair.right} undecided={undecided} />
  </article>;
}

function ProjectedTeam({ team, undecided }: { team?: CupTeamStanding; undecided: string }) {
  return <span className="flex min-w-0 flex-1 items-center gap-2">
    {team ? <><TeamMark abbr={team.abbr} color={UNKNOWN_COLOR} sources={[team.logo]} /><span className="min-w-0 truncate text-xs">{team.name}</span></>
      : <span className="truncate text-xs text-faint">{undecided}</span>}
  </span>;
}

function SlotMatch({ undecided }: { undecided: string }) {
  return <article className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-line bg-bg px-3 py-3 text-xs text-faint">
    {undecided} · {undecided}
  </article>;
}
