import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { formatTip } from "@/lib/nba/dates";
import { getCup } from "@/lib/nba/api";
import { localeFor, t, type Lang } from "@/lib/nba/i18n";
import type { CupGame, CupGroup, CupTeamStanding } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";
import { SectionNav } from "./section-nav";

const COPY: Record<Lang, {
  title: string; season: string; intro: string; groupPlay: string; projection: string;
  group: string; team: string; record: string; diff: string; played: string;
  leader: string; wildCard: string; wildcardRace: string; qualifies: string;
  knockout: string; quarterfinals: string; semifinals: string; final: string;
  undecided: string;
  schedule: string; upcoming: string; recent: string; noGames: string;
  rules: string; tieBreakers: string; updated: string; loading: string;
}> = {
  fr: { title:"NBA Cup", season:"Saison", intro:"30 équipes · 6 groupes · une coupe à gagner", groupPlay:"Phase de groupes", projection:"Classement provisoire", group:"Groupe", team:"Équipe", record:"Bilan", diff:"+/−", played:"MJ", leader:"Leader provisoire", wildCard:"Meilleur deuxième", wildcardRace:"Course à la qualification", qualifies:"Les 6 premiers de groupe et le meilleur deuxième de chaque conférence passent en quarts.", knockout:"Phase finale", quarterfinals:"Quarts de finale", semifinals:"Demi-finales", final:"Finale NBA Cup", undecided:"À déterminer", schedule:"Matchs de la Cup", upcoming:"À venir", recent:"Derniers matchs", noGames:"Aucun match de groupe trouvé pour cette conférence.", rules:"Chaque équipe joue les quatre autres de son groupe. Tous les matchs de Cup comptent pour la saison régulière, sauf la finale.", tieBreakers:"Égalité : face-à-face, différence de points, points marqués, bilan de la saison précédente. En prolongation, le différentiel est neutralisé.", updated:"Données mises à jour", loading:"Chargement des groupes et des matchs." },
  en: { title:"NBA Cup", season:"Season", intro:"30 teams · 6 groups · one cup to win", groupPlay:"Group play", projection:"Current standings", group:"Group", team:"Team", record:"Record", diff:"+/−", played:"GP", leader:"Current group leader", wildCard:"Best runner-up", wildcardRace:"Qualification race", qualifies:"The 6 group winners and the best runner-up in each conference advance to the quarterfinals.", knockout:"Knockout stage", quarterfinals:"Quarterfinals", semifinals:"Semifinals", final:"NBA Cup Final", undecided:"To be determined", schedule:"Cup games", upcoming:"Upcoming", recent:"Recent games", noGames:"No group games found for this conference.", rules:"Each team plays the other four in its group. All Cup games count toward the regular season except the championship.", tieBreakers:"Tiebreakers: head-to-head, point differential, points scored, prior-season record. Point differential is neutralized in overtime.", updated:"Data updated", loading:"Loading groups and games." },
  es: { title:"NBA Cup", season:"Temporada", intro:"30 equipos · 6 grupos · una copa", groupPlay:"Fase de grupos", projection:"Clasificación provisional", group:"Grupo", team:"Equipo", record:"Récord", diff:"+/−", played:"PJ", leader:"Líder provisional", wildCard:"Mejor segundo", wildcardRace:"Carrera por la clasificación", qualifies:"Los 6 líderes de grupo y el mejor segundo de cada conferencia avanzan a cuartos.", knockout:"Eliminatorias", quarterfinals:"Cuartos de final", semifinals:"Semifinales", final:"Final de la NBA Cup", undecided:"Por determinar", schedule:"Partidos de la Cup", upcoming:"Próximos", recent:"Últimos partidos", noGames:"No se encontraron partidos de grupo para esta conferencia.", rules:"Cada equipo juega contra los otros cuatro de su grupo. Todos los partidos cuentan para la temporada regular excepto la final.", tieBreakers:"Desempates: enfrentamiento directo, diferencia, puntos anotados y récord anterior. La diferencia se neutraliza en la prórroga.", updated:"Datos actualizados", loading:"Cargando grupos y partidos." },
  tr: { title:"NBA Cup", season:"Sezon", intro:"30 takım · 6 grup · tek kupa", groupPlay:"Grup aşaması", projection:"Geçici sıralama", group:"Grup", team:"Takım", record:"Galibiyet–mağlubiyet", diff:"+/−", played:"O", leader:"Grup lideri", wildCard:"En iyi ikinci", wildcardRace:"Tur yarışı", qualifies:"6 grup lideri ve her konferansın en iyi ikincisi çeyrek finale yükselir.", knockout:"Eleme aşaması", quarterfinals:"Çeyrek finaller", semifinals:"Yarı finaller", final:"NBA Cup Finali", undecided:"Belirlenecek", schedule:"Cup maçları", upcoming:"Yaklaşan", recent:"Son maçlar", noGames:"Bu konferans için grup maçı bulunamadı.", rules:"Her takım grubundaki diğer dört takımla oynar. Final dışındaki Cup maçları normal sezon sıralamasına dahildir.", tieBreakers:"Eşitlik: ikili averaj, sayı farkı, atılan sayı ve önceki sezon derecesi. Uzatmada fark sıfırlanır.", updated:"Veriler güncellendi", loading:"Gruplar ve maçlar yükleniyor." },
  ar: { title:"كأس NBA", season:"الموسم", intro:"30 فريقًا · 6 مجموعات · كأس واحد", groupPlay:"دور المجموعات", projection:"الترتيب الحالي", group:"المجموعة", team:"الفريق", record:"السجل", diff:"+/−", played:"لعب", leader:"متصدر المجموعة", wildCard:"أفضل وصيف", wildcardRace:"سباق التأهل", qualifies:"يتأهل متصدرو المجموعات الست وأفضل وصيف في كل مؤتمر إلى ربع النهائي.", knockout:"الأدوار الإقصائية", quarterfinals:"ربع النهائي", semifinals:"نصف النهائي", final:"نهائي كأس NBA", undecided:"يُحدد لاحقًا", schedule:"مباريات الكأس", upcoming:"القادمة", recent:"المباريات الأخيرة", noGames:"لا توجد مباريات مجموعات لهذا المؤتمر.", rules:"يلعب كل فريق مع الفرق الأربعة الأخرى في مجموعته. تُحتسب جميع المباريات للموسم العادي باستثناء النهائي.", tieBreakers:"كسر التعادل: المواجهات المباشرة، فارق النقاط، النقاط المسجلة، سجل الموسم السابق. يُلغى الفارق في الوقت الإضافي.", updated:"تم تحديث البيانات", loading:"جارٍ تحميل المجموعات والمباريات." },
  zh: { title:"NBA 杯", season:"赛季", intro:"30 支球队 · 6 个小组 · 争夺冠军", groupPlay:"小组赛", projection:"当前排名", group:"组", team:"球队", record:"胜负", diff:"+/−", played:"场", leader:"小组暂居第一", wildCard:"最佳小组第二", wildcardRace:"晋级竞争", qualifies:"6 个小组第一和每个分区成绩最好的小组第二晋级四分之一决赛。", knockout:"淘汰赛", quarterfinals:"四分之一决赛", semifinals:"半决赛", final:"NBA 杯决赛", undecided:"待定", schedule:"杯赛", upcoming:"即将进行", recent:"最近比赛", noGames:"该分区暂无小组赛。", rules:"每支球队与同组其他四支球队各赛一场。除决赛外，杯赛均计入常规赛。", tieBreakers:"排名规则：交手战绩、净胜分、总得分、上赛季战绩。加时赛净胜分按零计算。", updated:"数据已更新", loading:"正在加载分组和比赛。" }
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
  const wildcard = [...runnersUp].sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff || b.pointsFor - a.pointsFor)[0];
  const schedule = games.filter((item) => item.game.status === "pre" || item.game.status === "in").slice(0, 5);
  const recent = games.filter((item) => item.game.status === "post").slice(-5).reverse();
  const shownGames = schedule.length ? schedule : recent;

  return <main className="fixed inset-0 z-30 overflow-y-auto bg-bg">
    <div className="mx-auto min-h-screen max-w-6xl px-3 pb-12 pt-4 sm:px-4">
      <header className="flex flex-nowrap items-center justify-between gap-2 border-b border-line pb-4">
        <div className="min-w-0"><p className="text-xs uppercase tracking-widest text-accent">{copy.season} {cup?.season ?? seasonYear + "-" + String(seasonYear + 1).slice(-2)}</p><h1 className="truncate font-display text-3xl leading-none sm:text-4xl">{copy.title}</h1></div>
        <SectionNav active="cup" lang={lang} onScore={onScore} onStandings={onStandings} onNews={onNews} onPlayoff={onPlayoff} onCup={() => undefined} onSettings={onSettings} />
      </header>
      {!canSee ? <div className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-surface p-5">
        <p className="font-display text-3xl">{t(lang, "standLockTitle")}</p><p className="mt-3 text-sm text-muted">{t(lang, "standLockBody")}</p>
        <div className="mt-5"><PrimaryButton onClick={onUnlock}>{t(lang, "standReveal")}</PrimaryButton></div>
      </div> : <>
        <section className="mt-5 rounded-card border border-line bg-surface p-4 sm:p-5">
          <p className="font-display text-2xl">{copy.intro}</p><p className="mt-2 text-sm text-muted">{copy.qualifies}</p><p className="mt-2 text-xs text-faint">{copy.rules}</p>
        </section>
        <div className="mt-5 flex gap-2 sm:max-w-sm">{(["east", "west"] as const).map((key) =>
          <button key={key} type="button" onClick={() => setConference(key)} aria-pressed={conference === key}
            className={conference === key ? "min-h-11 flex-1 rounded-full bg-accent text-sm text-accent-ink" : "min-h-11 flex-1 rounded-full border border-line text-sm"}>{t(lang, key)}</button>)}</div>
        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-2"><div><h2 className="font-display text-2xl">{copy.groupPlay}</h2><p className="text-xs text-faint">{copy.projection} · {cup?.season ?? "2026–27"}</p></div>
            {cup && <p className="text-xs text-faint">{copy.updated} {formatTip(cup.fetchedAt, locale)}</p>}</div>
          {query.isLoading && <div className="h-36 animate-pulse rounded-card bg-surface" />}
          {query.data && !query.data.ok && <div className="rounded-card border border-line bg-surface p-4"><p>{t(lang, "loadError")}</p><button type="button" onClick={() => void query.refetch()} className="mt-3 min-h-10 rounded-full bg-accent px-4 text-sm text-accent-ink">{t(lang, "retry")}</button></div>}
          {cup && <div dir="ltr" className="grid gap-3 lg:grid-cols-3">{groups.map((group) => <GroupTable key={group.name} group={group} copy={copy} />)}</div>}
        </section>
        {cup && <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-card border border-line bg-surface p-4 sm:p-5"><h2 className="font-display text-2xl">{copy.wildcardRace}</h2><p className="mt-1 text-xs text-muted">{copy.qualifies}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {groups.map((group) => <Qualifier key={group.name} label={copy.leader + " · " + group.name} team={group.teams[0]?.played ? group.teams[0] : undefined} />)}
              <Qualifier label={copy.wildCard} team={wildcard} />
            </div>
          </section><Knockout copy={copy} games={cup.games.filter((item) => item.stage !== "group")} conference={conference} locale={locale} />
        </div>}
        {cup && <section className="mt-5 rounded-card border border-line bg-surface p-4 sm:p-5"><h2 className="font-display text-2xl">{copy.schedule}</h2><p className="mt-1 text-xs text-faint">{schedule.length ? copy.upcoming : copy.recent}</p>
          {shownGames.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{shownGames.map(({ game, group }) => <li key={game.id} className="flex items-center gap-2 rounded-2xl border border-line bg-bg px-3 py-3">
            <span className="w-14 shrink-0 text-[10px] text-faint">{formatTip(game.tipoff, locale)}</span><TeamMark abbr={game.away.abbr} color={UNKNOWN_COLOR} sources={[game.away.logo]} />
            <span className="min-w-0 flex-1 truncate text-xs">{game.away.short}</span><span dir="ltr" className="font-display text-lg tabular-nums">{game.status === "pre" ? "—" : (game.away.score ?? "—") + "–" + (game.home.score ?? "—")}</span>
            <span className="min-w-0 flex-1 truncate text-right text-xs">{game.home.short}</span><TeamMark abbr={game.home.abbr} color={UNKNOWN_COLOR} sources={[game.home.logo]} /><span className="sr-only">{copy.group} {group}</span>
          </li>)}</ul> : <p className="mt-3 text-sm text-muted">{copy.noGames}</p>}
        </section>}
        {cup && <p className="mt-4 text-xs text-faint">{copy.tieBreakers}</p>}
      </>}
    </div>
  </main>;
}

function GroupTable({ group, copy }: { group: CupGroup; copy: typeof COPY[Lang] }) {
  return <section className="overflow-hidden rounded-card border border-line bg-surface">
    <div className="flex items-center justify-between border-b border-line px-4 py-3"><h3 className="font-display text-xl">{copy.group} {group.name}</h3><span className="text-xs text-faint">{group.conference === "east" ? "EAST" : "WEST"}</span></div>
    <div className="grid grid-cols-[minmax(0,1fr)_2.2rem_3.3rem_2.7rem] gap-1 px-3 py-2 text-[10px] uppercase tracking-wider text-faint"><span>{copy.team}</span><span className="text-center">{copy.played}</span><span className="text-center">{copy.record}</span><span className="text-center">{copy.diff}</span></div>
    <ol className="divide-y divide-line">{group.teams.map((team,index) => <li key={team.id} className="grid grid-cols-[minmax(0,1fr)_2.2rem_3.3rem_2.7rem] items-center gap-1 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2"><span className="w-4 shrink-0 text-xs text-faint">{index+1}</span><TeamMark abbr={team.abbr} color={UNKNOWN_COLOR} sources={[team.logo]} /><span className="truncate text-xs">{team.name}</span></span>
      <span className="text-center text-xs tabular-nums">{team.played}</span><span className="text-center text-xs tabular-nums">{team.wins}–{team.losses}</span>
      <span className={team.pointDiff > 0 ? "text-center text-xs text-emerald-200" : team.pointDiff < 0 ? "text-center text-xs text-rose-200" : "text-center text-xs text-faint"}>{team.pointDiff > 0 ? "+" : ""}{team.pointDiff}</span>
    </li>)}</ol><p className="border-t border-line px-3 py-2 text-[10px] text-faint">{copy.leader}: {group.teams[0]?.played ? group.teams[0].name : copy.undecided}</p>
  </section>;
}
function Qualifier({ label, team }: { label: string; team?: CupTeamStanding }) {
  return <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-bg p-3">
    {team ? <TeamMark abbr={team.abbr} color={UNKNOWN_COLOR} sources={[team.logo]} /> : <span className="size-9 rounded-full border border-dashed border-line" />}
    <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-accent">{label}</span><span className="block truncate text-sm">{team?.name ?? "—"}</span>
      {team && <span className="text-xs text-faint">{team.wins}–{team.losses} · {team.pointDiff > 0 ? "+" : ""}{team.pointDiff}</span>}</span>
  </div>;
}
function Knockout({ copy, games, conference, locale }: {
  copy: typeof COPY[Lang]; games: CupGame[]; conference: "east" | "west"; locale: string;
}) {
  const quarterfinals = games.filter((item) => item.stage === "quarterfinal" && item.conference === conference);
  const semifinals = games.filter((item) => item.stage === "semifinal" && item.conference === conference);
  const finals = games.filter((item) => item.stage === "final");
  return <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
    <h2 className="font-display text-2xl">{copy.knockout}</h2>
    <div className="mt-3 grid gap-3">
      <RoundCard title={copy.quarterfinals} games={quarterfinals} slots={2} locale={locale} undecided={copy.undecided} tone="cyan" />
      <RoundCard title={copy.semifinals} games={semifinals} slots={1} locale={locale} undecided={copy.undecided} tone="violet" />
      <RoundCard title={copy.final} games={finals} slots={1} locale={locale} undecided={copy.undecided} tone="fuchsia" trophy />
    </div>
  </section>;
}

function RoundCard({ title, games, slots, locale, undecided, tone, trophy = false }: {
  title: string; games: CupGame[]; slots: number; locale: string; undecided: string;
  tone: "cyan" | "violet" | "fuchsia"; trophy?: boolean;
}) {
  const color = tone === "cyan" ? "border-cyan-400/30 bg-cyan-400/[0.035] text-cyan-100"
    : tone === "violet" ? "border-violet-400/30 bg-violet-400/[0.035] text-violet-100"
    : "border-fuchsia-400/30 bg-fuchsia-400/[0.035] text-fuchsia-100";
  const dates = Array.from(new Set(games.map((item) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(item.game.tipoff)))));
  const dateLabel = dates.length ? dates.join(" · ") : undecided;
  const shown = games.slice(0, slots);
  return <section className={"rounded-2xl border p-3 " + color}>
    <div className="flex items-center gap-2">
      {trophy && <Trophy aria-hidden="true" className="size-5 shrink-0" />}
      <h3 className="min-w-0 flex-1 font-display text-lg">{title}</h3>
      <span className="text-xs opacity-75">{dateLabel}</span>
    </div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {shown.map((item) => <CupMatch key={item.game.id} item={item} />)}
      {Array.from({ length: Math.max(0, slots - shown.length) }, (_, index) =>
        <SlotMatch key={"tbd-" + index} undecided={undecided} />
      )}
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

function SlotMatch({ undecided }: { undecided: string }) {
  return <article className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-line bg-bg px-3 py-3 text-xs text-faint">
    {undecided} · {undecided}
  </article>;
}
