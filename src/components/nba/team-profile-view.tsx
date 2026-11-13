import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { getPlayerProfile, getTeamProfile } from "@/lib/nba/api";
import type { Lang } from "@/lib/nba/i18n";

type Stat = { label: string; value: string };
type Player = {
  id: string; name: string; jersey: string; position: string; height: string; weight: string;
  age: string; experience: string; college: string; headshot: string; minutesPerGame: number;
  totalMinutes: number; stats: Stat[];
};

const COPY: Record<Lang, {
  roster: string; players: string; player: string; season: string; last: string; games: string;
  position: string; height: string; weight: string; age: string; experience: string;
  college: string; minutes: string; loading: string; unavailable: string; noGames: string;
  back: string; view: string; regular: string;
}> = {
  fr: { roster: "Effectif", players: "joueurs", player: "Fiche joueur", season: "Saison", last: "Derniers", games: "matchs", position: "Poste", height: "Taille", weight: "Poids", age: "Âge", experience: "Expérience", college: "Université", minutes: "Minutes / match", loading: "Chargement des données…", unavailable: "Données indisponibles pour le moment.", noGames: "Aucun historique de match fourni par le flux.", back: "Retour", view: "Voir la fiche", regular: "Saison régulière" },
  en: { roster: "Roster", players: "players", player: "Player profile", season: "Season", last: "Last", games: "games", position: "Position", height: "Height", weight: "Weight", age: "Age", experience: "Experience", college: "College", minutes: "Minutes / game", loading: "Loading data…", unavailable: "Data is temporarily unavailable.", noGames: "No game log supplied by the feed.", back: "Back", view: "View profile", regular: "Regular season" },
  es: { roster: "Plantilla", players: "jugadores", player: "Ficha del jugador", season: "Temporada", last: "Últimos", games: "partidos", position: "Posición", height: "Altura", weight: "Peso", age: "Edad", experience: "Experiencia", college: "Universidad", minutes: "Minutos / partido", loading: "Cargando datos…", unavailable: "Datos no disponibles.", noGames: "El feed no proporciona partidos recientes.", back: "Volver", view: "Ver ficha", regular: "Temporada regular" },
  tr: { roster: "Kadro", players: "oyuncu", player: "Oyuncu profili", season: "Sezon", last: "Son", games: "maç", position: "Pozisyon", height: "Boy", weight: "Kilo", age: "Yaş", experience: "Deneyim", college: "Üniversite", minutes: "Maç başına dakika", loading: "Veriler yükleniyor…", unavailable: "Veriler şu anda kullanılamıyor.", noGames: "Akışta maç geçmişi yok.", back: "Geri", view: "Profili gör", regular: "Normal sezon" },
  ar: { roster: "قائمة الفريق", players: "لاعبين", player: "ملف اللاعب", season: "الموسم", last: "آخر", games: "مباريات", position: "المركز", height: "الطول", weight: "الوزن", age: "العمر", experience: "الخبرة", college: "الجامعة", minutes: "دقائق لكل مباراة", loading: "جار تحميل البيانات…", unavailable: "البيانات غير متاحة مؤقتًا.", noGames: "لا يتوفر سجل مباريات في المصدر.", back: "رجوع", view: "عرض الملف", regular: "الموسم العادي" },
  zh: { roster: "球队名单", players: "名球员", player: "球员资料", season: "赛季", last: "最近", games: "场比赛", position: "位置", height: "身高", weight: "体重", age: "年龄", experience: "经验", college: "大学", minutes: "场均分钟", loading: "正在加载数据…", unavailable: "暂时无法获取数据。", noGames: "数据源未提供比赛记录。", back: "返回", view: "查看资料", regular: "常规赛" },
};

export function TeamProfileView({ teamId, lang, onClose }: { teamId: string; lang: Lang; onClose: () => void }) {
  const c = COPY[lang];
  const [playerId, setPlayerId] = useState<string | null>(null);
  const teamQuery = useQuery({ queryKey: ["team-profile", teamId], queryFn: () => getTeamProfile({ data: { id: teamId } }), staleTime: 15 * 60_000 });
  const team = teamQuery.data?.ok ? teamQuery.data.profile : null;
  const selected = team?.players.find((player: Player) => player.id === playerId) ?? null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-4">
        <header className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <button type="button" onClick={playerId ? () => setPlayerId(null) : onClose} className="flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm">
            <ChevronLeft className="size-4" /> {c.back}
          </button>
          <span className="font-display text-xl tracking-wide">NBA <b className="text-accent">PULSE</b></span>
        </header>
        {teamQuery.isLoading && <p className="py-12 text-center text-muted">{c.loading}</p>}
        {teamQuery.data && !teamQuery.data.ok && <p className="py-12 text-center text-muted">{c.unavailable}</p>}
        {team && !playerId && (
          <>
            <section className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
              {team.team.logo && <img src={team.team.logo} alt="" className="size-20 object-contain" />}
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-accent">{team.team.abbreviation}</p>
                <h1 className="font-display text-3xl sm:text-4xl">{team.team.name}</h1>
                {team.team.record && <p className="mt-1 text-sm text-muted">{team.team.record}</p>}
              </div>
            </section>
            <div className="mt-7 flex items-end justify-between">
              <h2 className="font-display text-2xl">{c.roster}</h2>
              <span className="text-xs text-faint">{team.players.length} {c.players}</span>
            </div>
            <p className="mt-2 text-xs text-muted">Tri : minutes moyennes par match, puis minutes cumulées.</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
              {team.players.map((player: Player, index: number) => (
                <button key={player.id || player.name} type="button" onClick={() => player.id && setPlayerId(player.id)} disabled={!player.id} className="flex min-h-[76px] w-full items-center gap-3 border-b border-line px-3 py-3 text-start last:border-0 hover:bg-raised disabled:opacity-60">
                  <span className="w-6 text-center font-display text-lg text-faint">{index + 1}</span>
                  {player.headshot ? <img src={player.headshot} alt="" className="size-12 rounded-full bg-raised object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-raised font-display text-lg">{player.jersey || "—"}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{player.name}</span>
                    <span className="block text-xs text-muted">{[player.position, player.jersey ? "#"+player.jersey : "", player.height, player.weight ? player.weight+" lb" : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-end">
                    <span className="block font-display text-xl tabular-nums">{player.minutesPerGame ? player.minutesPerGame.toFixed(1) : "—"}</span>
                    <span className="block text-[10px] text-faint">MIN</span>
                  </span>
                  <span className="text-accent">›</span>
                </button>
              ))}
            </div>
          </>
        )}
        {playerId && <PlayerDetail playerId={playerId} fallback={selected} lang={lang} />}
      </div>
    </div>
  );
}

function PlayerDetail({ playerId, fallback, lang }: { playerId: string; fallback: Player | null; lang: Lang }) {
  const c = COPY[lang];
  const [count, setCount] = useState(3);
  const query = useQuery({ queryKey: ["player-profile", playerId], queryFn: () => getPlayerProfile({ data: { id: playerId } }), staleTime: 10 * 60_000 });
  const profile = query.data?.ok ? query.data.profile : null;
  const recent = useMemo(() => profile?.games.slice(0, count) ?? [], [profile, count]);
  const average = (key: string) => {
    const values = recent.map((game: { stats: Stat[] }) => {
      const row = game.stats.find((stat) => stat.label.toLowerCase().includes(key));
      return row ? Number(row.value.replace(/[^0-9.-]/g, "")) : NaN;
    }).filter(Number.isFinite);
    return values.length ? (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1) : "—";
  };
  const player = profile?.player;
  return (
    <section className="mt-6">
      {query.isLoading && <p className="py-10 text-center text-muted">{c.loading}</p>}
      {query.data && !query.data.ok && <p className="py-10 text-center text-muted">{c.unavailable}</p>}
      {player && (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
            {player.headshot && <img src={player.headshot} alt="" className="size-24 rounded-xl bg-raised object-cover" />}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-accent">{c.player}</p>
              <h1 className="font-display text-3xl">{player.name}</h1>
              <p className="mt-1 text-sm text-muted">{[player.position, player.team].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[[c.height, player.height || fallback?.height], [c.weight, player.weight ? player.weight+" lb" : fallback?.weight], [c.age, player.age], [c.position, player.position || fallback?.position]].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-faint">{label}</p><p className="mt-1 font-medium">{value || "—"}</p></div>
            ))}
          </div>
          <h2 className="mt-7 font-display text-2xl">{c.season} · {c.regular}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {profile.season.map((stat: Stat) => <div key={stat.label} className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-faint">{stat.label}</p><p className="mt-1 font-display text-2xl tabular-nums">{stat.value}</p></div>)}
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{c.last} {count} {c.games}</h2>
            <div className="flex gap-1 rounded-full border border-line p-1">
              {[3, 6, 9].map((value) => <button key={value} type="button" onClick={() => setCount(value)} className={`min-h-9 min-w-9 rounded-full px-2 text-xs ${count === value ? "bg-accent text-accent-ink" : "text-muted"}`}>{value}</button>)}
            </div>
          </div>
          {recent.length === 0 ? <p className="mt-3 rounded-xl border border-line p-4 text-sm text-muted">{c.noGames}</p> : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["PTS", "points"], ["REB", "rebounds"], ["AST", "assists"]].map(([label, key]) => <div key={label} className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-faint">{label} · AVG</p><p className="font-display text-2xl">{average(key)}</p></div>)}
              </div>
              <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-xs text-faint"><tr><th className="p-3 text-start">Date</th><th className="p-3 text-start">Opponent</th><th className="p-3 text-start">Result</th><th className="p-3 text-start">Stats</th></tr></thead>
                  <tbody>{recent.map((game: { date: string; opponent: string; result: string; stats: Stat[] }, index: number) => <tr key={game.date+index} className="border-t border-line"><td className="p-3">{game.date || "—"}</td><td className="p-3">{game.opponent || "—"}</td><td className="p-3">{game.result || "—"}</td><td className="p-3">{game.stats.slice(0, 5).map((stat) => stat.value).join(" · ") || "—"}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
