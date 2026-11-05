import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { formatTip } from "@/lib/nba/dates";
import { getStandings } from "@/lib/nba/api";
import { localeFor, t, type Lang } from "@/lib/nba/i18n";
import type { StandingRow, Standings } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";
import { SectionNav } from "./section-nav";

const COPY: Record<Lang, {
  title: string;
  projection: string;
  playInNote: string;
  firstRound: string;
  semifinals: string;
  conferenceFinal: string;
  nbaFinal: string;
  eastChampion: string;
  westChampion: string;
  winner: string;
  game: string;
  playIn: string;
  playInAdvance: string;
  playInEliminate: string;
  playInFinal: string;
  loading: string;
}> = {
  fr: {
    title: "Playoff",
    projection: "Projection basée sur le classement chargé.",
    playInNote: "Les places 7 et 8 restent provisoires. Le play-in répartit les places 7 et 8 entre les équipes classées 7 à 10.",
    firstRound: "Premier tour",
    semifinals: "Demi-finales de conférence",
    conferenceFinal: "Finale de conférence",
    nbaFinal: "Finales NBA",
    eastChampion: "Champion de l’Est",
    westChampion: "Champion de l’Ouest",
    winner: "Vainqueur",
    game: "Match",
    playIn: "Play-in · places 7 à 10",
    playInAdvance: "Le vainqueur prend la 7e place",
    playInEliminate: "Le perdant est éliminé",
    playInFinal: "Le vainqueur prend la 8e place",
    loading: "Classement en cours de chargement.",
  },
  en: {
    title: "Playoffs",
    projection: "Projection from the standings snapshot.",
    playInNote: "Seeds 7 and 8 are provisional. The play-in assigns seeds 7 and 8 among teams ranked 7 through 10.",
    firstRound: "First round",
    semifinals: "Conference semifinals",
    conferenceFinal: "Conference finals",
    nbaFinal: "NBA Finals",
    eastChampion: "Eastern champion",
    westChampion: "Western champion",
    winner: "Winner",
    game: "Game",
    playIn: "Play-in · seeds 7–10",
    playInAdvance: "Winner takes seed 7",
    playInEliminate: "Loser is eliminated",
    playInFinal: "Winner takes seed 8",
    loading: "Loading standings.",
  },
  es: {
    title: "Playoff",
    projection: "Proyección según la clasificación cargada.",
    playInNote: "Los puestos 7 y 8 son provisionales. El play-in asigna esos puestos entre los equipos del 7 al 10.",
    firstRound: "Primera ronda",
    semifinals: "Semifinales de conferencia",
    conferenceFinal: "Final de conferencia",
    nbaFinal: "Finales NBA",
    eastChampion: "Campeón del Este",
    westChampion: "Campeón del Oeste",
    winner: "Ganador",
    game: "Partido",
    playIn: "Play-in · puestos 7–10",
    playInAdvance: "El ganador obtiene el puesto 7",
    playInEliminate: "El perdedor queda eliminado",
    playInFinal: "El ganador obtiene el puesto 8",
    loading: "Cargando clasificación.",
  },
  tr: {
    title: "Playoff",
    projection: "Yüklenen sıralamaya göre tahmin.",
    playInNote: "7 ve 8. sıralar geçicidir. Play-in, 7–10. sıradaki takımlar arasından 7 ve 8. sıraları belirler.",
    firstRound: "İlk tur",
    semifinals: "Konferans yarı finalleri",
    conferenceFinal: "Konferans finali",
    nbaFinal: "NBA Finalleri",
    eastChampion: "Doğu şampiyonu",
    westChampion: "Batı şampiyonu",
    winner: "Kazanan",
    game: "Maç",
    playIn: "Play-in · 7–10. sıralar",
    playInAdvance: "Kazanan 7. sırayı alır",
    playInEliminate: "Kaybeden elenir",
    playInFinal: "Kazanan 8. sırayı alır",
    loading: "Sıralama yükleniyor.",
  },
  ar: {
    title: "الأدوار الإقصائية",
    projection: "توقع حسب الترتيب الحالي.",
    playInNote: "المركزان ٧ و٨ مؤقتان. تحدد مباريات الملحق المركزين بين الفرق من ٧ إلى ١٠.",
    firstRound: "الدور الأول",
    semifinals: "نصف نهائي المنطقة",
    conferenceFinal: "نهائي المنطقة",
    nbaFinal: "نهائيات NBA",
    eastChampion: "بطل الشرق",
    westChampion: "بطل الغرب",
    winner: "الفائز",
    game: "مباراة",
    playIn: "الملحق · المراكز ٧–١٠",
    playInAdvance: "الفائز يحصل على المركز ٧",
    playInEliminate: "الخاسر يخرج",
    playInFinal: "الفائز يحصل على المركز ٨",
    loading: "جارٍ تحميل الترتيب.",
  },
  zh: {
    title: "季后赛",
    projection: "根据当前排名预测。",
    playInNote: "第 7 和第 8 名暂定。附加赛将在第 7 至第 10 名之间决出这两个席位。",
    firstRound: "首轮",
    semifinals: "分区半决赛",
    conferenceFinal: "分区决赛",
    nbaFinal: "NBA 总决赛",
    eastChampion: "东部冠军",
    westChampion: "西部冠军",
    winner: "胜者",
    game: "场",
    playIn: "附加赛 · 第 7–10 名",
    playInAdvance: "胜者获得第 7 名",
    playInEliminate: "负者淘汰",
    playInFinal: "胜者获得第 8 名",
    loading: "正在加载排名。",
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
  if (!open) return null;
  const locale = localeFor(lang);
  const table = query.data?.ok ? query.data.standings : null;
  const rows = conferenceRows(table, conference);
  const c = COPY[lang];

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-6xl px-3 pb-12 pt-4 sm:px-4">
        <header className="flex flex-nowrap items-center justify-between gap-2">
          <h1 className="min-w-0 truncate font-display text-3xl sm:text-4xl">{c.title}</h1>
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
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-faint">
                <p>{c.projection}{table.phase ? ` ${table.season} · ${table.phase}` : ` ${table.season}`}</p>
                <p>{t(lang, "updated", { time: formatTip(table.fetchedAt, locale) })}</p>
              </div>
            )}
            <div className="mt-5 flex gap-2 sm:max-w-sm">
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
            {query.isLoading && <div className="mt-5 h-48 animate-pulse rounded-card bg-surface" />}
            {query.data && !query.data.ok && (
              <div className="mt-5">
                <p>{t(lang, "loadError")}</p>
                <button type="button" onClick={() => void query.refetch()} className="mt-3 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
                  {t(lang, "retry")}
                </button>
              </div>
            )}
            {table && (
              <>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{c.playInNote}</p>
                <div dir="ltr" className="mt-5 grid gap-5 xl:grid-cols-3">
                  <Round title={c.firstRound}>
                    {[{ a: 1, b: 8 }, { a: 4, b: 5 }, { a: 3, b: 6 }, { a: 2, b: 7 }].map((pair, index) => (
                      <MatchCard key={index} label={`${c.game} ${index + 1}`} pair={pair} rows={rows} provisional={[7, 8]} />
                    ))}
                  </Round>
                  <Round title={c.semifinals}>
                    {[["G1", "G2"], ["G3", "G4"]].map((pair, index) => (
                      <SlotMatch key={index} label={`${c.game} ${index + 5}`} left={pair[0]} right={pair[1]} winner={c.winner} />
                    ))}
                  </Round>
                  <Round title={c.conferenceFinal}>
                    <SlotMatch label={`${c.game} 7`} left="G5" right="G6" winner={c.winner} />
                  </Round>
                </div>
                <section className="mt-8 rounded-card border border-line bg-surface p-4 sm:p-5">
                  <h2 className="font-display text-2xl">{c.playIn}</h2>
                  <div dir="ltr" className="mt-4 grid gap-3 md:grid-cols-3">
                    <MatchCard label={`${c.game} 1`} pair={{ a: 7, b: 8 }} rows={rows} provisional={[7, 8]} note={c.playInAdvance} />
                    <MatchCard label={`${c.game} 2`} pair={{ a: 9, b: 10 }} rows={rows} provisional={[]} note={c.playInEliminate} />
                    <SlotMatch label={`${c.game} 3`} left="Loser G1" right="Winner G2" winner={c.playInFinal} />
                  </div>
                </section>
                <section className="mt-5 rounded-card border border-line bg-surface p-4 sm:p-5">
                  <h2 className="font-display text-xl">{c.nbaFinal}</h2>
                  <div dir="ltr" className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Placeholder label={c.eastChampion} />
                    <Placeholder label={c.westChampion} />
                  </div>
                </section>
              </>
            )}
            {!table && !query.isLoading && !query.data && <p className="mt-5 text-sm text-muted">{c.loading}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function conferenceRows(table: Standings | null, conference: Conference): StandingRow[] {
  return conference === "east" ? table?.east ?? [] : table?.west ?? [];
}

function Round({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function MatchCard({
  label,
  pair,
  rows,
  provisional,
  note,
}: {
  label: string;
  pair: SeedPair;
  rows: StandingRow[];
  provisional: number[];
  note?: string;
}) {
  const a = typeof pair.a === "number" ? rows[pair.a - 1] : null;
  const b = typeof pair.b === "number" ? rows[pair.b - 1] : null;
  return (
    <article className="rounded-2xl border border-line bg-bg p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-faint">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SeedTeam seed={pair.a} row={a} provisional={typeof pair.a === "number" && provisional.includes(pair.a)} />
        <SeedTeam seed={pair.b} row={b} provisional={typeof pair.b === "number" && provisional.includes(pair.b)} />
      </div>
      {note && <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>}
    </article>
  );
}

function SeedTeam({ seed, row, provisional }: { seed: number | string; row: StandingRow | undefined; provisional: boolean }) {
  if (typeof seed !== "number") return <Placeholder label={seed} />;
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-xl border px-2 py-2 ${provisional ? "border-accent/40 bg-raised" : "border-line bg-surface"}`}>
      <span className="w-5 shrink-0 text-xs tabular-nums text-faint">{seed}{provisional ? "*" : ""}</span>
      {row ? (
        <>
          <TeamMark abbr={row.abbr} color={UNKNOWN_COLOR} sources={[row.logo]} />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">{row.name}</span>
            <span className="block text-[10px] text-faint">{row.wins}–{row.losses}</span>
          </span>
        </>
      ) : <span className="text-xs text-faint">TBD</span>}
    </div>
  );
}

function SlotMatch({ label, left, right, winner }: { label: string; left: string; right: string; winner: string }) {
  return (
    <article className="rounded-2xl border border-line bg-bg p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-faint">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Placeholder label={left} />
        <Placeholder label={right} />
      </div>
      <p className="mt-2 text-xs text-muted">{winner}</p>
    </article>
  );
}

function Placeholder({ label }: { label: string }) {
  return <span className="flex min-h-10 items-center rounded-xl border border-dashed border-line px-3 py-2 text-xs text-faint">{label}</span>;
}
