import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { formatTip } from "@/lib/nba/dates";
import { getPlayoffScores, getStandings } from "@/lib/nba/api";
import { localeFor, phaseLabel, t, type Lang } from "@/lib/nba/i18n";
import type { PlayoffSeriesScore, StandingRow, Standings } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";
import { SectionNav } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  projection: string;
  firstRound: string;
  semifinals: string;
  conferenceFinal: string;
  nbaFinal: string;
  eastChampion: string;
  westChampion: string;
  game: string;
  playIn: string;
  loading: string;
  tbd: string;
}> = {
  fr: {
    title: "Playoff",
    projection: "Projection du classement",
    firstRound: "Premier tour",
    semifinals: "Demi-finales",
    conferenceFinal: "Finale de conférence",
    nbaFinal: "Finales NBA",
    eastChampion: "Champion de l’Est",
    westChampion: "Champion de l’Ouest",
    game: "Match",
    playIn: "Play-in",
    loading: "Classement en cours de chargement.",
    tbd: "À déterminer",
  },
  en: {
    title: "Playoffs",
    projection: "Standings projection",
    firstRound: "First round",
    semifinals: "Semifinals",
    conferenceFinal: "Conference final",
    nbaFinal: "NBA Finals",
    eastChampion: "Eastern champion",
    westChampion: "Western champion",
    game: "Game",
    playIn: "Play-in",
    loading: "Loading standings.",
    tbd: "TBD",
  },
  es: {
    title: "Playoff",
    projection: "Proyección de la clasificación",
    firstRound: "Primera ronda",
    semifinals: "Semifinales",
    conferenceFinal: "Final de conferencia",
    nbaFinal: "Finales NBA",
    eastChampion: "Campeón del Este",
    westChampion: "Campeón del Oeste",
    game: "Partido",
    playIn: "Play-in",
    loading: "Cargando clasificación.",
    tbd: "Por determinar",
  },
  tr: {
    title: "Playoff",
    projection: "Sıralama tahmini",
    firstRound: "İlk tur",
    semifinals: "Yarı finaller",
    conferenceFinal: "Konferans finali",
    nbaFinal: "NBA Finalleri",
    eastChampion: "Doğu şampiyonu",
    westChampion: "Batı şampiyonu",
    game: "Maç",
    playIn: "Play-in",
    loading: "Sıralama yükleniyor.",
    tbd: "Belirlenecek",
  },
  ar: {
    title: "الأدوار الإقصائية",
    projection: "توقع حسب الترتيب",
    firstRound: "الدور الأول",
    semifinals: "نصف النهائي",
    conferenceFinal: "نهائي المنطقة",
    nbaFinal: "نهائيات NBA",
    eastChampion: "بطل الشرق",
    westChampion: "بطل الغرب",
    game: "مباراة",
    playIn: "الملحق",
    loading: "جارٍ تحميل الترتيب.",
    tbd: "يُحدد لاحقًا",
  },
  zh: {
    title: "季后赛",
    projection: "根据排名预测",
    firstRound: "首轮",
    semifinals: "半决赛",
    conferenceFinal: "分区决赛",
    nbaFinal: "NBA 总决赛",
    eastChampion: "东部冠军",
    westChampion: "西部冠军",
    game: "场",
    playIn: "附加赛",
    loading: "正在加载排名。",
    tbd: "待定",
  },
};

type Conference = "east" | "west";
type SeedPair = { a: number | string; b: number | string };

export function PlayoffView({
  lang,
  open,
  canSee,
  onUnlock,
  onScore,
  onStandings,
  onNews,
  onSettings,
}: {
  lang: Lang;
  open: boolean;
  canSee: boolean;
  onUnlock: () => void;
  onScore: () => void;
  onStandings: () => void;
  onNews: () => void;
  onSettings: () => void;
}) {
  const [conference, setConference] = useState<Conference>("east");
  const query = useQuery({
    queryKey: ["standings"],
    enabled: open && canSee,
    queryFn: () => getStandings({ data: { confirm: true } }),
  });
  const table = query.data?.ok ? query.data.standings : null;
  const seasonYear = postseasonYear(table?.season ?? "");
  const scoreQuery = useQuery({
    queryKey: ["playoff-series-scores", seasonYear],
    enabled: open && canSee && seasonYear > 0,
    staleTime: 45_000,
    queryFn: () => getPlayoffScores({ data: { seasonYear } }),
  });
  if (!open) return null;
  const locale = localeFor(lang);
  const rows = conference === "east" ? table?.east ?? [] : table?.west ?? [];
  const copy = COPY[lang];
  const scores = scoreQuery.data?.ok ? scoreQuery.data.scores : null;
  const teams: [number, number][] = [[1, 8], [4, 5], [3, 6], [2, 7]];

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-6xl px-3 pb-12 pt-4 sm:px-4">
        <header className="flex flex-nowrap items-center justify-between gap-2">
          <h1 className="min-w-0 truncate font-display text-3xl sm:text-4xl">{copy.title}</h1>
          <SectionNav
            active="playoff"
            lang={lang}
            onScore={onScore}
            onStandings={onStandings}
            onNews={onNews}
            onPlayoff={() => undefined}
            onSettings={onSettings}
          />
        </header>
        {!canSee ? (
          <div className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-surface p-5">
            <p className="font-display text-3xl">{t(lang, "standLockTitle")}</p>
            <p className="mt-3 text-sm text-muted">{t(lang, "standLockBody")}</p>
            <div className="mt-5">
              <PrimaryButton onClick={onUnlock}>{t(lang, "standReveal")}</PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            {table && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-faint">
                <p>{copy.projection} · {table.season}{table.phase ? ` · ${phaseLabel(String(table.phase), lang)}` : ""}</p>
                <p>{t(lang, "updated", { time: formatTip(table.fetchedAt, locale) })}</p>
              </div>
            )}
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
            {query.data && !query.data.ok && (
              <div className="mt-5">
                <p>{t(lang, "loadError")}</p>
                <button type="button" onClick={() => void query.refetch()} className="mt-3 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
                  {t(lang, "retry")}
                </button>
              </div>
            )}
            {table && (
              <div dir="ltr" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Round title={copy.firstRound}>
                  {teams.map(([a, b], index) => (
                    <MatchCard
                      key={index}
                      label={`${copy.game} ${index + 1}`}
                      a={rows[a - 1]}
                      b={rows[b - 1]}
                      score={readSeriesScore(rows[a - 1], rows[b - 1], scores, copy.tbd)}
                      lang={lang}
                    />
                  ))}
                </Round>
                <Round title={copy.semifinals}>
                  {[[`${copy.game} 1`, `${copy.game} 2`], [`${copy.game} 3`, `${copy.game} 4`]].map((pair, index) => (
                    <SlotMatch key={index} label={`${copy.game} ${index + 5}`} left={pair[0]} right={pair[1]} score={copy.tbd} />
                  ))}
                </Round>
                <Round title={copy.conferenceFinal}>
                  <SlotMatch label={`${copy.game} 7`} left={copy.semifinals} right={copy.semifinals} score={copy.tbd} />
                </Round>
                <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
                  <h2 className="font-display text-xl">{copy.playIn}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {[[7, 8], [9, 10]].map(([a, b], index) => (
                      <MatchCard
                        key={index}
                        label={`${copy.game} ${index + 1}`}
                        a={rows[a - 1]}
                        b={rows[b - 1]}
                        score={readSeriesScore(rows[a - 1], rows[b - 1], scores, copy.tbd)}
                        lang={lang}
                      />
                    ))}
                    <SlotMatch label={`${copy.game} 3`} left={copy.semifinals} right={copy.semifinals} score={copy.tbd} />
                  </div>
                </section>
                <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
                  <h2 className="font-display text-xl">{copy.nbaFinal}</h2>
                  <SlotMatch label={copy.nbaFinal} left={copy.eastChampion} right={copy.westChampion} score={copy.tbd} />
                </section>
              </div>
            )}
            {!table && !query.isLoading && !query.data && <p className="mt-5 text-sm text-muted">{copy.loading}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function postseasonYear(season: string): number {
  const years = season.match(/d{4}/g)?.map(Number) ?? [];
  if (years.length > 1) return years[1] ?? 0;
  return years.length === 1 ? (years[0] ?? 0) + 1 : 0;
}

function readSeriesScore(
  a: StandingRow | undefined,
  b: StandingRow | undefined,
  scores: PlayoffSeriesScore[] | null,
  tbd: string,
): string {
  if (!a || !b || !scores) return scores === null ? "—" : tbd;
  const series = scores.find((item) =>
    (item.teamAId === a.id && item.teamBId === b.id) ||
    (item.teamAId === b.id && item.teamBId === a.id)
  );
  if (!series) return "0–0";
  return series.teamAId === a.id
    ? `${series.teamAWins}–${series.teamBWins}`
    : `${series.teamBWins}–${series.teamAWins}`;
}

function Round({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function MatchCard({ label, a, b, score, lang }: {
  label: string;
  a: StandingRow | undefined;
  b: StandingRow | undefined;
  score: string;
  lang: Lang;
}) {
  return (
    <article className="rounded-2xl border border-line bg-bg px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-faint">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <TeamLine seed={1} row={a} lang={lang} />
        <p dir="ltr" className="shrink-0 font-display text-xl tabular-nums">{score}</p>
        <TeamLine seed={8} row={b} lang={lang} />
      </div>
    </article>
  );
}

function TeamLine({ seed, row, lang }: { seed: number; row: StandingRow | undefined; lang: Lang }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="w-5 shrink-0 text-xs tabular-nums text-faint">{seed}</span>
      {row ? (
        <>
          <TeamMark abbr={row.abbr} color={UNKNOWN_COLOR} sources={[row.logo]} />
          <span className="min-w-0 truncate text-xs font-medium">{row.name}</span>
        </>
      ) : <span className="truncate text-xs text-faint">{COPY[lang].tbd}</span>}
    </div>
  );
}

function SlotMatch({ label, left, right, score }: { label: string; left: string; right: string; score: string }) {
  return (
    <article className="rounded-2xl border border-line bg-bg px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-faint">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-xs text-faint">{left}</span>
        <span dir="ltr" className="shrink-0 font-display text-xl tabular-nums text-faint">{score}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-faint">{right}</span>
      </div>
    </article>
  );
}
