import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { getPlayoffScores, getStandings } from "@/lib/nba/api";
import { t, type Lang } from "@/lib/nba/i18n";
import type { PlayoffSeriesScore, StandingRow } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";
import { PageHeader } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  firstRound: string;
  semifinals: string;
  conferenceFinal: string;
  nbaFinal: string;
  eastChampion: string;
  westChampion: string;
  playIn: string;
  loading: string;
  tbd: string;
}> = {
  fr: { title: "Playoff", firstRound: "Premier tour", semifinals: "Demi-finales", conferenceFinal: "Finale de conférence", nbaFinal: "Finales NBA", eastChampion: "Champion de l’Est", westChampion: "Champion de l’Ouest", playIn: "Play-in", loading: "Classement en cours de chargement.", tbd: "À déterminer" },
  en: { title: "Playoffs", firstRound: "First round", semifinals: "Semifinals", conferenceFinal: "Conference final", nbaFinal: "NBA Finals", eastChampion: "Eastern champion", westChampion: "Western champion", playIn: "Play-in", loading: "Loading standings.", tbd: "TBD" },
  es: { title: "Playoff", firstRound: "Primera ronda", semifinals: "Semifinales", conferenceFinal: "Final de conferencia", nbaFinal: "Finales NBA", eastChampion: "Campeón del Este", westChampion: "Campeón del Oeste", playIn: "Play-in", loading: "Cargando clasificación.", tbd: "Por determinar" },
  tr: { title: "Playoff", firstRound: "İlk tur", semifinals: "Yarı finaller", conferenceFinal: "Konferans finali", nbaFinal: "NBA Finalleri", eastChampion: "Doğu şampiyonu", westChampion: "Batı şampiyonu", playIn: "Play-in", loading: "Sıralama yükleniyor.", tbd: "Belirlenecek" },
  ar: { title: "الأدوار الإقصائية", firstRound: "الدور الأول", semifinals: "نصف النهائي", conferenceFinal: "نهائي المنطقة", nbaFinal: "نهائيات NBA", eastChampion: "بطل الشرق", westChampion: "بطل الغرب", playIn: "الملحق", loading: "جارٍ تحميل الترتيب.", tbd: "يُحدد لاحقًا" },
  zh: { title: "季后赛", firstRound: "首轮", semifinals: "半决赛", conferenceFinal: "分区决赛", nbaFinal: "NBA 总决赛", eastChampion: "东部冠军", westChampion: "西部冠军", playIn: "附加赛", loading: "正在加载排名。", tbd: "待定" },
};

type Conference = "east" | "west";
type RoundTone = "cyan" | "violet" | "amber" | "fuchsia" | "emerald";
type SeriesSlot = {
  left?: StandingRow;
  right?: StandingRow;
  seedLeft?: number;
  seedRight?: number;
  score: string;
};
type ConferenceBracket = {
  first: SeriesSlot[];
  semifinals: SeriesSlot[];
  final: SeriesSlot;
  champion?: StandingRow;
};

export function PlayoffView({
  lang, open, canSee, onUnlock, onScore, onStandings, onNews, onCup, onSettings,
}: {
  lang: Lang;
  open: boolean;
  canSee: boolean;
  onUnlock: () => void;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onCup: () => void;
  onSettings: () => void;
}) {
  const [conference, setConference] = useState<Conference>("east");
  const query = useQuery({
    queryKey: ["standings"],
    enabled: open && canSee,
    staleTime: 60_000,
    refetchInterval: 300_000,
    queryFn: () => getStandings({ data: { confirm: true } }),
  });
  const table = query.data?.ok ? query.data.standings : null;
  const seasonYear = postseasonYear(table?.season ?? "");
  const scoreQuery = useQuery({
    queryKey: ["playoff-series-scores", seasonYear],
    enabled: open && canSee && seasonYear > 0,
    staleTime: 30_000,
    refetchInterval: (current) =>
      current.state.data?.ok && current.state.data.scores.some((series) => series.liveScoreA != null || series.liveScoreB != null)
        ? 30_000
        : 300_000,
    queryFn: () => getPlayoffScores({ data: { seasonYear } }),
  });
  if (!open) return null;

  const copy = COPY[lang];
  const scores = scoreQuery.data?.ok ? scoreQuery.data.scores : null;
  const eastRows = table?.east ?? [];
  const westRows = table?.west ?? [];
  const selectedRows = conference === "east" ? eastRows : westRows;
  const eastBracket = buildConferenceBracket(eastRows, scores, copy.tbd);
  const westBracket = buildConferenceBracket(westRows, scores, copy.tbd);
  const bracket = conference === "east" ? eastBracket : westBracket;
  const nbaFinalScore = readSeriesScore(eastBracket.champion, westBracket.champion, scores, copy.tbd);
  const standingsError = query.isError || query.data?.ok === false;
  const scoresError = scoreQuery.isError || scoreQuery.data?.ok === false;
  const playIn78Winner = singleGameWinner(selectedRows[6], selectedRows[7], scores);
  const playIn78Loser = playIn78Winner === selectedRows[6] ? selectedRows[7] : playIn78Winner === selectedRows[7] ? selectedRows[6] : undefined;
  const playIn910Winner = singleGameWinner(selectedRows[8], selectedRows[9], scores);

  return (
    <div className="fixed inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-6xl px-3 pb-12 pt-4">
        <PageHeader
          active="playoff"
          title={copy.title}
          lang={lang}
          onScore={onScore}
          onStandings={onStandings}
          onNews={onNews}
          onPlayoff={() => undefined}
          onCup={onCup}
          onSettings={onSettings}
        />
        {!canSee ? (
          <div className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-surface p-5">
            <p className="font-display text-3xl">{t(lang, "standLockTitle")}</p>
            <p className="mt-3 text-sm text-muted">{t(lang, "standLockBody")}</p>
            <div className="mt-5"><PrimaryButton onClick={onUnlock}>{t(lang, "standReveal")}</PrimaryButton></div>
          </div>
        ) : (
          <>
            {table && <p className="mt-4 text-xs text-faint">{table.season}</p>}
            <div className="mt-4 flex gap-2 sm:max-w-sm">
              {(["east", "west"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setConference(key)}
                  aria-pressed={conference === key}
                  className={`min-h-11 flex-1 rounded-full text-sm ${conference === key ? "bg-accent text-accent-ink" : "border border-line"}`}
                >
                  {t(lang, key)}
                </button>
              ))}
            </div>
            {query.isLoading && <div className="mt-5 h-36 animate-pulse rounded-card bg-surface" />}
            {standingsError && (
              <DataError lang={lang} onRetry={() => void query.refetch()} />
            )}
            {!table && !query.isLoading && !standingsError && <p className="mt-5 text-sm text-muted">{copy.loading}</p>}
            {table && !standingsError && (
              <>
                {scoresError && <DataError lang={lang} onRetry={() => void scoreQuery.refetch()} />}
                {!scoresError && scoreQuery.isLoading && <div className="mt-4 h-14 animate-pulse rounded-card bg-surface" />}
                <div dir="ltr" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Round title={copy.firstRound} tone="cyan">
                    {bracket.first.map((match, index) => (
                      <SeriesMatch key={index} {...match} lang={lang} tbd={copy.tbd} tone="cyan" />
                    ))}
                  </Round>
                  <Round title={copy.semifinals} tone="violet">
                    {bracket.semifinals.map((match, index) => (
                      <SeriesMatch key={index} {...match} lang={lang} tbd={copy.tbd} tone="violet" />
                    ))}
                  </Round>
                  <Round
                    title={copy.conferenceFinal}
                    tone="amber"
                    headerAdornment={
                      <ConferenceChampionBadge
                        label={conference === "east" ? copy.eastChampion : copy.westChampion}
                        team={bracket.champion}
                      />
                    }
                  >
                    <SeriesMatch {...bracket.final} lang={lang} tbd={copy.tbd} tone="amber" />
                  </Round>
                  <section className="rounded-card border border-fuchsia-400/30 bg-fuchsia-400/[0.035] p-4 sm:p-5">
                    <h2 className="flex items-center gap-2 font-display text-xl text-fuchsia-200">
                      <Trophy aria-hidden="true" className="size-6 shrink-0" />
                      {copy.nbaFinal}
                    </h2>
                    <div className="mt-3">
                      <SeriesMatch
                        left={eastBracket.champion}
                        right={westBracket.champion}
                        score={nbaFinalScore}
                        lang={lang}
                        tbd={copy.tbd}
                        tone="fuchsia"
                      />
                    </div>
                  </section>
                  <Round title={copy.playIn} tone="emerald">
                    <SeriesMatch
                      left={selectedRows[6]}
                      right={selectedRows[7]}
                      seedLeft={7}
                      seedRight={8}
                      score={readSingleGameScore(selectedRows[6], selectedRows[7], scores, copy.tbd)}
                      lang={lang}
                      tbd={copy.tbd}
                      tone="emerald"
                    />
                    <SeriesMatch
                      left={selectedRows[8]}
                      right={selectedRows[9]}
                      seedLeft={9}
                      seedRight={10}
                      score={readSingleGameScore(selectedRows[8], selectedRows[9], scores, copy.tbd)}
                      lang={lang}
                      tbd={copy.tbd}
                      tone="emerald"
                    />
                    <SeriesMatch
                      left={playIn78Loser}
                      right={playIn910Winner}
                      score={readSingleGameScore(playIn78Loser, playIn910Winner, scores, copy.tbd)}
                      lang={lang}
                      tbd={copy.tbd}
                      tone="emerald"
                    />
                  </Round>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function postseasonYear(season: string): number {
  const match = season.match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
  if (match) {
    const first = Number(match[1]);
    const suffix = Number(match[2]);
    return match[2]!.length === 2 ? Math.floor(first / 100) * 100 + suffix : suffix;
  }
  const year = Number(season.match(/\d{4}/)?.[0] ?? 0);
  return year;
}

function buildConferenceBracket(rows: StandingRow[], scores: PlayoffSeriesScore[] | null, tbd: string): ConferenceBracket {
  const playIn78Winner = singleGameWinner(rows[6], rows[7], scores);
  const playIn78Loser = playIn78Winner === rows[6] ? rows[7] : playIn78Winner === rows[7] ? rows[6] : undefined;
  const playIn910Winner = singleGameWinner(rows[8], rows[9], scores);
  const seed8 = singleGameWinner(playIn78Loser, playIn910Winner, scores);
  const seedPairs: { seedLeft: number; seedRight: number; left?: StandingRow; right?: StandingRow }[] = [
    { seedLeft: 1, seedRight: 8, left: rows[0], right: seed8 },
    { seedLeft: 4, seedRight: 5, left: rows[3], right: rows[4] },
    { seedLeft: 3, seedRight: 6, left: rows[2], right: rows[5] },
    { seedLeft: 2, seedRight: 7, left: rows[1], right: playIn78Winner },
  ];
  const first = seedPairs.map(({ seedLeft, seedRight, left, right }) => ({
    left,
    right,
    seedLeft,
    seedRight,
    score: readSeriesScore(left, right, scores, tbd),
  }));
  const firstWinners = first.map((match) => seriesWinner(match.left, match.right, scores));
  const semifinalPairs: [number, number][] = [[0, 1], [2, 3]];
  const semifinals = semifinalPairs.map(([aIndex, bIndex]) => {
    const left = firstWinners[aIndex];
    const right = firstWinners[bIndex];
    return { left, right, score: readSeriesScore(left, right, scores, tbd) };
  });
  const semiWinners = semifinals.map((match) => seriesWinner(match.left, match.right, scores));
  const final = { left: semiWinners[0], right: semiWinners[1], score: readSeriesScore(semiWinners[0], semiWinners[1], scores, tbd) };
  return { first, semifinals, final, champion: seriesWinner(final.left, final.right, scores) };
}

function findSeries(a: StandingRow | undefined, b: StandingRow | undefined, scores: PlayoffSeriesScore[] | null) {
  if (!a || !b || !scores) return undefined;
  return scores.find((item) =>
    (item.teamAId === a.id && item.teamBId === b.id) ||
    (item.teamAId === b.id && item.teamBId === a.id)
  );
}

function readSeriesScore(a: StandingRow | undefined, b: StandingRow | undefined, scores: PlayoffSeriesScore[] | null, tbd: string): string {
  if (!a || !b || !scores) return scores === null ? "—" : tbd;
  const series = findSeries(a, b, scores);
  if (!series) return "0–0";
  return series.teamAId === a.id
    ? `${series.teamAWins}–${series.teamBWins}`
    : `${series.teamBWins}–${series.teamAWins}`;
}

function seriesWinner(a: StandingRow | undefined, b: StandingRow | undefined, scores: PlayoffSeriesScore[] | null): StandingRow | undefined {
  const series = findSeries(a, b, scores);
  if (!series) return undefined;
  if (series.teamAWins >= 4) return series.teamAId === a?.id ? a : b;
  if (series.teamBWins >= 4) return series.teamBId === a?.id ? a : b;
  return undefined;
}

function readSingleGameScore(a: StandingRow | undefined, b: StandingRow | undefined, scores: PlayoffSeriesScore[] | null, tbd: string): string {
  const series = findSeries(a, b, scores);
  if (!series) return tbd;
  const scoreA = series.liveScoreA ?? series.lastScoreA;
  const scoreB = series.liveScoreB ?? series.lastScoreB;
  if (scoreA == null || scoreB == null) return tbd;
  return series.teamAId === a?.id ? `${scoreA}–${scoreB}` : `${scoreB}–${scoreA}`;
}

function singleGameWinner(a: StandingRow | undefined, b: StandingRow | undefined, scores: PlayoffSeriesScore[] | null): StandingRow | undefined {
  const series = findSeries(a, b, scores);
  if (!series || series.teamAWins + series.teamBWins !== 1) return undefined;
  return series.teamAWins === 1 ? (series.teamAId === a?.id ? a : b) : (series.teamBId === a?.id ? a : b);
}

const TONE_CLASSES: Record<RoundTone, { section: string; card: string; heading: string; score: string }> = {
  cyan: { section: "border-cyan-400/30 bg-cyan-400/[0.035]", card: "border-cyan-400/25", heading: "text-cyan-200", score: "text-cyan-100" },
  violet: { section: "border-violet-400/30 bg-violet-400/[0.035]", card: "border-violet-400/25", heading: "text-violet-200", score: "text-violet-100" },
  amber: { section: "border-amber-400/35 bg-amber-400/[0.04]", card: "border-amber-400/30", heading: "text-amber-200", score: "text-amber-100" },
  fuchsia: { section: "border-fuchsia-400/30 bg-fuchsia-400/[0.035]", card: "border-fuchsia-400/25", heading: "text-fuchsia-200", score: "text-fuchsia-100" },
  emerald: { section: "border-emerald-400/30 bg-emerald-400/[0.035]", card: "border-emerald-400/25", heading: "text-emerald-200", score: "text-emerald-100" },
};

function Round({ title, tone, children, headerAdornment }: { title: string; tone: RoundTone; children: ReactNode; headerAdornment?: ReactNode }) {
  const colors = TONE_CLASSES[tone];
  return (
    <section className={`rounded-card border p-4 sm:p-5 ${colors.section}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className={`min-w-0 font-display text-xl ${colors.heading}`}>{title}</h2>
        {headerAdornment}
      </div>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ConferenceChampionBadge({ label, team }: { label: string; team?: StandingRow }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 py-1 ps-1.5 pe-2 text-[10px] font-semibold tracking-wide text-amber-100">
      <Trophy aria-hidden="true" className="size-4 shrink-0" />
      <span className="max-w-32 truncate leading-tight" title={team?.name || label}>{team ? `${label} · ${team.name}` : label}</span>
    </div>
  );
}

function SeriesMatch({ left, right, seedLeft, seedRight, score, lang, tbd, tone }: {
  left?: StandingRow;
  right?: StandingRow;
  seedLeft?: number;
  seedRight?: number;
  score: string;
  lang: Lang;
  tbd: string;
  tone: RoundTone;
}) {
  const colors = TONE_CLASSES[tone];
  return (
    <article className={`rounded-2xl border bg-bg px-3 py-3 ${colors.card}`}>
      <div className="flex items-center gap-3">
        <TeamLine seed={seedLeft} row={left} tbd={tbd} />
        <p dir="ltr" className={`shrink-0 font-display text-xl tabular-nums ${colors.score}`}>{score}</p>
        <TeamLine seed={seedRight} row={right} tbd={tbd} />
      </div>
    </article>
  );
}

function TeamLine({ seed, row, tbd }: { seed?: number; row?: StandingRow; tbd: string }) {
  const displayedSeed = seed ?? (row?.seed ? Number(row.seed) : undefined);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {displayedSeed != null && <span className="w-5 shrink-0 text-xs tabular-nums text-faint">{displayedSeed}</span>}
      {row ? (
        <>
          <TeamMark abbr={row.abbr} color={UNKNOWN_COLOR} sources={[row.logo]} />
          <span className="min-w-0 truncate text-xs font-medium">{row.name}</span>
        </>
      ) : <span className="truncate text-xs text-faint">{tbd}</span>}
    </div>
  );
}

function DataError({ lang, onRetry }: { lang: Lang; onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-card border border-line bg-surface p-4">
      <p>{t(lang, "loadError")}</p>
      <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
        {t(lang, "retry")}
      </button>
    </div>
  );
}
