import { fairProbs, parseAmerican } from "./odds.ts";
import { broadcastIsNational } from "./rank.ts";
import { cssColor, darkLogo, franchiseById, titleWeight, UNKNOWN_COLOR } from "./teams.ts";
import type {
  Clip,
  CupStage,
  GameCard,
  GameDetail,
  GameStatus,
  Injury,
  Leader,
  OddsView,
  PlayerLine,
  PlayoffSeriesScore,
  Side,
  Slate,
  StandingRow,
  Standings,
} from "./types.ts";

const HOST = "https://site.api.espn.com";
const memory = new Map<string, { exp: number; body: unknown }>();

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

async function espn(path: string, ttlMs: number): Promise<unknown> {
  const hit = memory.get(path);
  if (hit && hit.exp > Date.now()) return hit.body;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(`${HOST}${path}`, {
      headers: { accept: "application/json", "user-agent": "NBAPulse/1.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const body: unknown = await res.json();
    memory.set(path, { exp: Date.now() + ttlMs, body });
    return body;
  } finally {
    clearTimeout(timer);
  }
}



async function espnWeb(path: string, ttlMs: number): Promise<unknown> {
  const key = "web:" + path;
  const hit = memory.get(key);
  if (hit && hit.exp > Date.now()) return hit.body;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch("https://site.web.api.espn.com" + path, {
      headers: { accept: "application/json", "user-agent": "NBAPulse/1.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("web feed " + res.status);
    const body: unknown = await res.json();
    memory.set(key, { exp: Date.now() + ttlMs, body });
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function mapStatus(name: string, state: string): GameStatus {
  const n = name.toUpperCase();
  if (n.includes("POSTPON")) return "postponed";
  if (n.includes("CANCEL")) return "canceled";
  if (n.includes("DELAY")) return "delayed";
  if (state === "in") return "in";
  if (state === "post") return "post";
  if (state === "pre") return "pre";
  return "other";
}

function sideFrom(raw: unknown, fallbackLogo: string): Side | null {
  const row = obj(raw);
  const team = obj(row?.team);
  if (!row || !team) return null;
  const id = str(team.id);
  const known = franchiseById(id);
  const abbr = known?.abbr || str(team.abbreviation) || "NBA";
  const lines = arr(row.linescores)
    .map((line) => num(obj(line)?.value))
    .filter((value): value is number => value != null);
  const logoAlt = str(team.logo) || (known ? `https://a.espncdn.com/i/teamlogos/nba/500/${known.slug}.png` : "");
  const logo = known ? darkLogo(known.slug) : logoAlt || fallbackLogo;
  return {
    id,
    abbr,
    name: str(team.displayName) || known?.name || abbr,
    short: str(team.shortDisplayName) || known?.city || abbr,
    logo,
    logoAlt: logoAlt || logo,
    color: cssColor(str(team.color), known?.color ?? UNKNOWN_COLOR),
    score: num(row.score),
    winner: row.winner === true,
    lines,
  };
}

function readsBroadcasts(comp: Record<string, unknown>): { nationalTv: boolean; broadcasts: string[]; nationalNames: string[] } {
  const names: string[] = [];
  const nationalNames: string[] = [];
  let nationalTv = false;
  for (const item of arr(comp.broadcasts)) {
    const row = obj(item);
    if (!row) continue;
    const market = str(row.market);
    for (const name of arr(row.names)) {
      if (typeof name !== "string" || !name.trim()) continue;
      const clean = name.trim();
      names.push(clean);
      if (broadcastIsNational(market, clean)) {
        nationalTv = true;
        nationalNames.push(clean);
      }
    }
  }
  const single = str(obj(comp.broadcast)?.name);
  if (single) {
    names.push(single);
    if (broadcastIsNational(str(obj(comp.broadcast)?.market), single)) {
      nationalTv = true;
      nationalNames.push(single);
    }
  }
  return {
    nationalTv,
    broadcasts: [...new Set(names)].slice(0, 6),
    nationalNames: [...new Set(nationalNames)].slice(0, 3),
  };
}

export function eventToGame(event: unknown, venueHint?: string | null): GameCard | null {
  const row = obj(event);
  const comp = obj(arr(row?.competitions)[0]);
  if (!row || !comp) return null;
  const competitors = arr(comp.competitors);
  const homeRaw = competitors.find((item) => str(obj(item)?.homeAway) === "home") ?? competitors[1];
  const awayRaw = competitors.find((item) => str(obj(item)?.homeAway) === "away") ?? competitors[0];
  const home = sideFrom(homeRaw, "");
  const away = sideFrom(awayRaw, "");
  if (!home || !away) return null;
  const statusObj = obj(comp.status) ?? obj(row.status);
  const type = obj(statusObj?.type);
  const state = str(type?.state);
  const rawName = str(type?.name);
  const venueObj = obj(comp.venue);
  const venue = venueHint ?? (str(venueObj?.fullName) || null);
  const cast = readsBroadcasts(comp);
  const status = mapStatus(rawName, state);
  const quiet = status !== "in" && status !== "post";
  if (quiet) {
    home.score = null;
    away.score = null;
    home.winner = false;
    away.winner = false;
    home.lines = [];
    away.lines = [];
  }
  return {
    id: str(row.id) || str(comp.id),
    tipoff: str(comp.date) || str(row.date),
    status,
    rawName,
    period: num(statusObj?.period) ?? 0,
    clock: str(statusObj?.displayClock),
    completed: type?.completed === true || state === "post",
    home,
    away,
    nationalTv: cast.nationalTv,
    nationalNames: cast.nationalNames,
    broadcasts: cast.broadcasts,
    titleWeight: titleWeight(home.id, away.id),
    venue,
  };
}

function seasonOf(root: Record<string, unknown>): { season: string; phase: string } {
  const league = obj(arr(root.leagues)[0]);
  const season = obj(league?.season) ?? obj(obj(root.header)?.season) ?? obj(root.season);
  return {
    season: str(season?.displayName),
    phase: str(obj(season?.type)?.name) || str(obj(season?.type)?.abbreviation),
  };
}

export async function loadSlate(date: string): Promise<Slate> {
  const body = obj(await espn(`/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`, 45_000));
  if (!body) throw new Error("feed");
  const meta = seasonOf(body);
  const games = arr(body.events)
    .map((event) => eventToGame(event))
    .filter((game): game is GameCard => game != null && game.id.length > 0);
  return { date, season: meta.season, phase: meta.phase, games, fetchedAt: new Date().toISOString() };
}

function statIndex(names: string[], key: string): number {
  return names.findIndex((name) => name.toUpperCase() === key);
}

function playerLine(raw: unknown): PlayerLine | null {
  const row = obj(raw);
  const athlete = obj(row?.athlete);
  if (!row || !athlete) return null;
  const stats = arr(row.stats).map((item) => (typeof item === "string" ? item : ""));
  return {
    id: str(athlete.id),
    name: str(athlete.displayName) || str(athlete.fullName),
    jersey: str(athlete.jersey),
    pos: str(obj(athlete.position)?.abbreviation),
    starter: row.starter === true,
    dnp: row.didNotPlay === true,
    reason: str(row.reason),
    ...indexStats(stats),
  };
}

function indexStats(stats: string[]): Pick<PlayerLine, "min" | "pts" | "reb" | "ast" | "stl" | "blk" | "fg" | "tp" | "ft" | "pm"> {
  return {
    min: stats[0] ?? "",
    pts: stats[1] ?? "",
    fg: stats[2] ?? "",
    tp: stats[3] ?? "",
    ft: stats[4] ?? "",
    reb: stats[5] ?? "",
    ast: stats[6] ?? "",
    stl: stats[8] ?? "",
    blk: stats[9] ?? "",
    pm: stats[13] ?? "",
  };
}

function applyNamedStats(line: PlayerLine, names: string[], stats: string[]): PlayerLine {
  const pick = (key: string) => {
    const index = statIndex(names, key);
    return index >= 0 ? (stats[index] ?? "") : "";
  };
  if (!names.length) return line;
  return {
    ...line,
    min: pick("MIN"),
    pts: pick("PTS"),
    reb: pick("REB"),
    ast: pick("AST"),
    stl: pick("STL"),
    blk: pick("BLK"),
    fg: pick("FG"),
    tp: pick("3PT"),
    ft: pick("FT"),
    pm: pick("+/-"),
  };
}

function boxOf(root: Record<string, unknown>): { teamId: string; players: PlayerLine[] }[] {
  const players = arr(obj(root.boxscore)?.players);
  return players.flatMap((group) => {
    const row = obj(group);
    const teamId = str(obj(row?.team)?.id);
    const stat = obj(arr(row?.statistics)[0]);
    const names = arr(stat?.names).map((name) => str(name).toUpperCase());
    const lines = arr(stat?.athletes)
      .map((athlete) => {
        const parsed = playerLine(athlete);
        if (!parsed) return null;
        const stats = arr(obj(athlete)?.stats).map((item) => (typeof item === "string" ? item : ""));
        return applyNamedStats(parsed, names, stats);
      })
      .filter((line): line is PlayerLine => line != null && line.name.length > 0);
    return teamId ? [{ teamId, players: lines }] : [];
  });
}

function collectLinks(value: unknown, found: string[]): void {
  if (typeof value === "string") {
    if (value.startsWith("http")) found.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectLinks(item, found));
    return;
  }
  const row = obj(value);
  if (!row) return;
  Object.values(row).forEach((item) => collectLinks(item, found));
}

function clipsOf(root: Record<string, unknown>, roster: string[], game: GameCard): Clip[] {
  const clips: Clip[] = [];
  for (const item of arr(root.videos)) {
    const row = obj(item);
    if (!row) continue;
    const links: string[] = [];
    collectLinks(row.links, links);
    const youtube = links.find((link) => /(?:youtube\.com|youtu\.be)/i.test(link));
    if (!youtube) continue;
    const title = str(row.headline) || str(row.description);
    if (!title) continue;
    const names = [...roster].sort((a, b) => b.length - a.length);
    const player = names.find((name) => name.length > 3 && title.toLowerCase().includes(name.toLowerCase())) ?? null;
    const packageClip = /highlights/i.test(title);
    clips.push({
      id: String(row.id ?? youtube),
      title,
      thumbnail: str(row.thumbnail),
      url: youtube,
      duration: num(row.duration) ?? 0,
      player,
      kind: packageClip ? "package" : "play",
    });
  }

  const unique = [...new Map(clips.map((clip) => [clip.id, clip])).values()];
  const highlight = unique.find((clip) => /highlights?/i.test(clip.title));
  const recap = unique.find((clip) => /full game|full match|recap|condensed/i.test(clip.title) && !/highlights?/i.test(clip.title));
  const matchup = `${game.away.name} vs ${game.home.name}`;
  const gameDate = game.tipoff.slice(0, 10);
  const searchClip = (category: "highlights" | "recap", query: string): Clip => ({
    id: `youtube-${category}-${game.id}`,
    title: query,
    thumbnail: "",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    duration: 0,
    player: null,
    kind: "package",
    category,
  });
  return [
    highlight ? { ...highlight, category: "highlights" as const } : searchClip("highlights", `${matchup} NBA game highlights ${gameDate}`),
    recap ? { ...recap, category: "recap" as const } : searchClip("recap", `${matchup} NBA full game recap ${gameDate}`),
  ];
}
function oddsFrom(comp: Record<string, unknown> | null, pick: Record<string, unknown> | null, homeId: string, awayId: string): OddsView | null {
  const fetchedAt = new Date().toISOString();
  const book = obj(arr(comp?.odds)[0]);
  const ml = obj(book?.moneyline);
  const homeClose = parseAmerican(obj(obj(ml?.home)?.close)?.odds ?? obj(ml?.home)?.odds);
  const awayClose = parseAmerican(obj(obj(ml?.away)?.close)?.odds ?? obj(ml?.away)?.odds);
  if (homeClose != null && awayClose != null) {
    const fair = fairProbs(homeClose, awayClose);
    if (!fair) return null;
    return {
      provider: str(obj(book?.provider)?.displayName) || str(obj(book?.provider)?.name) || "Feed",
      fetchedAt,
      homeAmerican: homeClose,
      awayAmerican: awayClose,
      homeProb: fair.home,
      awayProb: fair.away,
    };
  }
  if (!pick) return null;
  const homeSide = obj(pick.homeTeamOdds);
  const awaySide = obj(pick.awayTeamOdds);
  const homeMl = parseAmerican(homeSide?.moneyLine);
  const awayMl = parseAmerican(awaySide?.moneyLine);
  if (homeMl == null || awayMl == null) return null;
  const homeTeam = str(homeSide?.teamId);
  const awayTeam = str(awaySide?.teamId);
  if (homeTeam && homeTeam !== homeId) return null;
  if (awayTeam && awayTeam !== awayId) return null;
  const fair = fairProbs(homeMl, awayMl);
  if (!fair) return null;
  return {
    provider: str(obj(pick.provider)?.name) || "Feed",
    fetchedAt,
    homeAmerican: homeMl,
    awayAmerican: awayMl,
    homeProb: fair.home,
    awayProb: fair.away,
  };
}

const LEADER_STAT: Record<string, Leader["stat"]> = {
  pointspergame: "pts",
  points: "pts",
  reboundspergame: "reb",
  rebounds: "reb",
  assistspergame: "ast",
  assists: "ast",
};

function leadersOf(root: Record<string, unknown>): Leader[] {
  const leaders: Leader[] = [];
  for (const group of arr(root.leaders)) {
    const row = obj(group);
    const team = obj(row?.team);
    const teamId = str(team?.id);
    const teamName = str(team?.displayName);
    for (const cat of arr(row?.leaders)) {
      const category = obj(cat);
      const stat = LEADER_STAT[str(category?.name).toLowerCase()];
      if (!stat) continue;
      const top = obj(arr(category?.leaders)[0]);
      const athlete = obj(top?.athlete);
      if (!top || !athlete) continue;
      leaders.push({
        stat,
        name: str(athlete.displayName),
        athleteId: str(athlete.id),
        teamId,
        team: teamName,
        value: str(top.displayValue) || String(num(top.value) ?? ""),
        position: str(obj(athlete.position)?.abbreviation),
      });
    }
  }
  return leaders.filter((leader) => leader.name && leader.value);
}

function injuriesOf(root: Record<string, unknown>): Injury[] {
  const injuries: Injury[] = [];
  for (const group of arr(root.injuries)) {
    const row = obj(group);
    const team = obj(row?.team);
    for (const item of arr(row?.injuries)) {
      const injury = obj(item);
      const athlete = obj(injury?.athlete);
      if (!injury || !athlete) continue;
      const detailObj = obj(injury.details);
      const detail = str(injury.type) || str(detailObj?.type) || str(detailObj?.detail) || str(injury.shortComment);
      injuries.push({
        athleteId: str(athlete.id),
        name: str(athlete.displayName) || str(athlete.fullName),
        team: str(team?.displayName),
        teamId: str(team?.id),
        status: str(injury.status),
        detail,
      });
    }
  }
  return injuries.filter((injury) => injury.name && injury.status);
}

export async function loadGame(id: string): Promise<GameDetail> {
  const body = obj(await espn(`/apis/site/v2/sports/basketball/nba/summary?event=${id}`, 60_000));
  if (!body) throw new Error("feed");
  const header = obj(body.header);
  const game = eventToGame(header);
  if (!game) throw new Error("feed");
  const comp = obj(arr(header?.competitions)[0]);
  const info = obj(body.gameInfo);
  const venue = str(obj(info?.venue)?.fullName) || game.venue;
  const attendance = num(comp?.attendance) ?? num(info?.attendance);
  const roster = boxOf(body).flatMap((group) => group.players.map((player) => player.name));
  const pick = obj(arr(body.pickcenter)[0]);
  return {
    game: { ...game, venue },
    attendance,
    box: boxOf(body),
    clips: clipsOf(body, roster.length ? roster : leadersOf(body).map((leader) => leader.name), game),
    odds: oddsFrom(comp, pick, game.home.id, game.away.id),
    injuries: injuriesOf(body),
    leaders: leadersOf(body),
    fetchedAt: new Date().toISOString(),
  };
}

export async function loadPlayoffSeriesScores(seasonYear: number): Promise<PlayoffSeriesScore[]> {
  const path = `/apis/site/v2/sports/basketball/nba/scoreboard?dates=${seasonYear}0401-${seasonYear}0701&seasontype=3`;
  const body = obj(await espn(path, 30_000));
  if (!body) throw new Error("feed");
  const series = new Map<string, PlayoffSeriesScore>();

  for (const event of arr(body.events)) {
    const row = obj(event);
    const comp = obj(arr(row?.competitions)[0]);
    const competitors = arr(comp?.competitors);
    const home = obj(competitors.find((item) => str(obj(item)?.homeAway) === "home"));
    const away = obj(competitors.find((item) => str(obj(item)?.homeAway) === "away"));
    const homeTeam = obj(home?.team);
    const awayTeam = obj(away?.team);
    const homeId = str(homeTeam?.id);
    const awayId = str(awayTeam?.id);
    if (!homeId || !awayId) continue;

    const teamAId = [homeId, awayId].sort()[0]!;
    const teamBId = [homeId, awayId].sort()[1]!;
    const key = `${teamAId}:${teamBId}`;
    const score = series.get(key) ?? {
      teamAId,
      teamBId,
      teamAWins: 0,
      teamBWins: 0,
      liveScoreA: null,
      liveScoreB: null,
      lastScoreA: null,
      lastScoreB: null,
    };
    const homeScore = num(home?.score);
    const awayScore = num(away?.score);
    const status = obj(obj(comp?.status)?.type) ?? obj(obj(row?.status)?.type);
    const state = str(status?.state);
    const completed = status?.completed === true || state === "post";

    if (completed && homeScore != null && awayScore != null) {
      score.lastScoreA = homeId === teamAId ? homeScore : awayScore;
      score.lastScoreB = homeId === teamBId ? homeScore : awayScore;
      if (homeScore !== awayScore) {
        const homeWon = obj(competitors.find((item) => obj(item)?.winner === true)) === home;
        const homeWins = homeWon || (!competitors.some((item) => obj(item)?.winner === true) && homeScore > awayScore);
        if (homeWins) {
          if (homeId === teamAId) score.teamAWins += 1;
          else score.teamBWins += 1;
        } else if (awayId === teamAId) score.teamAWins += 1;
        else score.teamBWins += 1;
      }
    } else if (state === "in" && homeScore != null && awayScore != null) {
      score.liveScoreA = homeId === teamAId ? homeScore : awayScore;
      score.liveScoreB = homeId === teamBId ? homeScore : awayScore;
    }
    series.set(key, score);
  }

  return [...series.values()];
}

function phaseName(value: unknown): string {
  if (value === 1 || value === "1") return "Preseason";
  if (value === 2 || value === "2") return "Regular Season";
  if (value === 3 || value === "3") return "Postseason";
  if (typeof value === "string" && value && !/^\d+$/.test(value)) return value;
  const named = str(obj(value)?.name);
  return named;
}

function standingRow(raw: unknown): StandingRow | null {
  const row = obj(raw);
  const team = obj(row?.team);
  if (!row || !team) return null;
  const stats = new Map<string, string>();
  for (const item of arr(row.stats)) {
    const stat = obj(item);
    if (!stat) continue;
    stats.set(str(stat.name), str(stat.displayValue));
  }
  const id = str(team.id);
  const known = franchiseById(id);
  const pctRaw = stats.get("winPercent") ?? "";
  return {
    id,
    name: str(team.displayName) || known?.name || "",
    abbr: known?.abbr || str(team.abbreviation),
    logo: known ? darkLogo(known.slug) : str(arr(team.logos).map((logo) => str(obj(logo)?.href)).find(Boolean)) || str(team.logo),
    wins: stats.get("wins") ?? "",
    losses: stats.get("losses") ?? "",
    pct: pctRaw.startsWith(".") ? `0${pctRaw}` : pctRaw,
    gb: stats.get("gamesBehind") ?? "",
    streak: stats.get("streak") ?? "",
    seed: stats.get("playoffSeed") ?? "",
  };
}

export async function loadStandings(): Promise<Standings> {
  const body = obj(await espn("/apis/v2/sports/basketball/nba/standings", 120_000));
  if (!body) throw new Error("feed");
  const children = arr(body.children);
  const read = (needle: string) => {
    const group = children
      .map((child) => obj(child))
      .find((child) => str(child?.abbreviation).toLowerCase().startsWith(needle) || str(child?.name).toLowerCase().includes(needle));
    const table = obj(group?.standings);
    const season = str(table?.seasonDisplayName);
    const phase = phaseName(table?.seasonType);
    const rows = arr(table?.entries)
      .map(standingRow)
      .filter((row): row is StandingRow => row != null)
      .sort((a, b) => {
        const aSeed = Number(a.seed);
        const bSeed = Number(b.seed);
        if (aSeed > 0 && bSeed > 0 && aSeed !== bSeed) return aSeed - bSeed;
        const byWins = Number(b.wins) - Number(a.wins);
        if (byWins !== 0) return byWins;
        return Number(a.losses) - Number(b.losses);
      });
    return { season, phase, rows };
  };
  const east = read("east");
  const west = read("west");
  return {
    season: east.season || west.season,
    phase: typeof east.phase === "string" ? east.phase : "",
    east: east.rows,
    west: west.rows,
    fetchedAt: new Date().toISOString(),
  };
}


export type CupFeedGame = { game: GameCard; stage: CupStage; note: string };

function cupStageFromNote(note: string): CupStage | null {
  const value = note.toLowerCase();
  const cupMarker = /nba cup|emirates cup|in-season tournament|in season tournament/.test(value);
  const groupMarker = /group(?:\\s+(?:play|[a-c]|[1-3]))?/.test(value);
  if (!cupMarker && !groupMarker) return null;
  if (/championship|champion|nba cup final/.test(value)) return "final";
  if (/semifinal|semi-final/.test(value)) return "semifinal";
  if (/quarterfinal|quarter-final/.test(value)) return "quarterfinal";
  if (groupMarker || cupMarker) return "group";
  return null;
}

export async function loadCupFeed(seasonYear: number): Promise<CupFeedGame[]> {
  const months = [10, 11, 12];
  const fetchMonth = async (month: number) => {
    const monthKey = `${seasonYear}${String(month).padStart(2, "0")}`;
    return obj(await espn(`/apis/site/v2/sports/basketball/nba/scoreboard?dates=${monthKey}&limit=300`, 30_000));
  };
  const results = await Promise.allSettled(months.map(fetchMonth));
  const bodies = results.map((result) => result.status === "fulfilled" ? result.value : null);
  // Retry only failed month windows, one at a time, to avoid taking down the whole Cup view for one ESPN hiccup.
  for (const index of results.flatMap((result, index) => result.status === "rejected" ? [index] : [])) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    try { bodies[index] = await fetchMonth(months[index]!); } catch { /* Keep the successful month windows. */ }
  }
  if (bodies.every((body) => body == null)) {
    try {
      bodies.push(obj(await espn(`/apis/site/v2/sports/basketball/nba/scoreboard?dates=${seasonYear}&limit=1000`, 30_000)));
    } catch { /* Throw the standard feed error below. */ }
  }
  if (bodies.every((body) => body == null)) throw new Error("feed");
  const result = new Map<string, CupFeedGame>();
  for (const body of bodies) {
    for (const event of arr(body?.events)) {
      const row = obj(event);
      const comp = obj(arr(row?.competitions)[0]);
      if (!row || !comp) continue;
      const notes = arr(comp.notes).flatMap((item) => {
        const note = obj(item);
        return [str(note?.headline), str(note?.description)].filter(Boolean);
      });
      const noteText = [...notes, str(comp.note), str(row.name), str(row.shortName)].join(" · ");
      const stage = cupStageFromNote(noteText);
      const game = eventToGame(event);
      if (stage && game) result.set(game.id, { game, stage, note: noteText });
    }
  }
  return [...result.values()].sort((a, b) => a.game.tipoff.localeCompare(b.game.tipoff));
}


export type NbaProfileStat = { label: string; value: string };
export type NbaProfilePlayer = {
  id: string; name: string; jersey: string; position: string; height: string;
  weight: string; age: string; experience: string; college: string; headshot: string;
  minutesPerGame: number; totalMinutes: number; stats: NbaProfileStat[];
};
export type NbaTeamProfile = {
  team: { id: string; name: string; abbreviation: string; logo: string; location: string; record: string };
  players: NbaProfilePlayer[];
};
export type NbaPlayerProfile = {
  player: { id: string; name: string; position: string; team: string; height: string; weight: string; age: string; headshot: string };
  season: NbaProfileStat[];
  games: { date: string; opponent: string; result: string; stats: NbaProfileStat[] }[];
};

function statRows(root: unknown): NbaProfileStat[] {
  const found: NbaProfileStat[] = [];
  const rootRow = obj(root);
  for (const category of arr(rootRow?.categories)) {
    const group = obj(category);
    const labels = arr(group?.labels).map(str);
    const totals = arr(group?.totals).map(str);
    labels.forEach((label, index) => {
      const names: Record<string, string> = { GP: "Games played", GS: "Games started", MIN: "Minutes per game", PTS: "Points per game", REB: "Rebounds per game", AST: "Assists per game", STL: "Steals per game", BLK: "Blocks per game", TO: "Turnovers per game", "FG%": "Field goal percentage", "3P%": "Three point percentage", "FT%": "Free throw percentage" };
      if (label && totals[index] != null) found.push({ label: names[label] || label, value: totals[index]! });
    });
  }
  const walk = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    const row = obj(value);
    if (!row) return;
    const label = str(row.displayName) || str(row.abbreviation) || str(row.name);
    const display = str(row.displayValue) || (num(row.value) != null ? String(row.value) : "");
    if (label && display && !found.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
      found.push({ label, value: display });
    }
    Object.entries(row).forEach(([key, item]) => {
      if (["athlete", "team", "logos", "headshot"].includes(key)) return;
      if (Array.isArray(item)) walk(item);
    });
  };
  walk(root);
  return found;
}

function profileNumber(stats: NbaProfileStat[], ...keys: string[]): number {
  const row = stats.find((item) => keys.some((key) => item.label.toLowerCase().replace(/[^a-z]/g, "").includes(key)));
  if (!row) return 0;
  const value = Number(row.value.replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function athleteFrom(raw: unknown): Record<string, unknown> | null {
  const row = obj(raw);
  if (!row) return null;
  return obj(row.athlete) ?? row;
}

function profileStatSelection(stats: NbaProfileStat[]): NbaProfileStat[] {
  const wanted = ["games played", "minutes per game", "points per game", "rebounds per game", "assists per game", "steals per game", "blocks per game", "field goal percentage", "three point percentage", "free throw percentage"];
  return wanted.flatMap((key) => {
    const item = stats.find((stat) => stat.label.toLowerCase() === key || stat.label.toLowerCase().replace(/[^a-z]/g, "") === key.replace(/[^a-z]/g, ""));
    return item ? [item] : [];
  });
}

export async function loadTeamProfile(id: string): Promise<NbaTeamProfile> {
  const rosterRoot = obj(await espn(`/apis/site/v2/sports/basketball/nba/teams/${id}/roster`, 15 * 60_000));
  if (!rosterRoot) throw new Error("roster unavailable");
  const team = obj(rosterRoot.team);
  const athletes = arr(rosterRoot.athletes).flatMap((item) => {
    const group = obj(item);
    if (Array.isArray(group?.items)) return arr(group?.items);
    return [item];
  }).map(athleteFrom).filter((item): item is Record<string, unknown> => item != null);
  const players = await Promise.all(athletes.map(async (athlete) => {
    const playerId = str(athlete.id);
    let stats: NbaProfileStat[] = [];
    if (playerId) {
      try {
        const root = await espnWeb(`/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats?season=2027&seasontype=2`, 20 * 60_000);
        stats = statRows(root);
      } catch { /* Roster details remain available if an athlete stats feed is unavailable. */ }
    }
    const headshot = str(obj(athlete.headshot)?.href) || str(athlete.headshot);
    return {
      id: playerId,
      name: str(athlete.displayName) || str(athlete.fullName),
      jersey: str(athlete.jersey),
      position: str(obj(athlete.position)?.abbreviation) || str(obj(athlete.position)?.displayName),
      height: str(athlete.displayHeight),
      weight: str(athlete.displayWeight),
      age: num(athlete.age) != null ? String(athlete.age) : "",
      experience: str(obj(athlete.experience)?.displayValue) || str(obj(athlete.experience)?.years),
      college: str(athlete.college),
      headshot,
      minutesPerGame: profileNumber(stats, "minutespergame", "minpergame"),
      totalMinutes: profileNumber(stats, "gamesplayed") * profileNumber(stats, "minutespergame", "minpergame"),
      stats,
    } satisfies NbaProfilePlayer;
  }));
  players.sort((a, b) => b.minutesPerGame - a.minutesPerGame || b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name));
  const record = str(obj(rosterRoot.record)?.items && arr(obj(rosterRoot.record)?.items).map((item) => str(obj(item)?.summary)).find(Boolean));
  return {
    team: {
      id,
      name: str(team?.displayName) || str(rosterRoot.displayName),
      abbreviation: str(team?.abbreviation),
      logo: str(team?.logos && arr(team?.logos).map((item) => str(obj(item)?.href)).find(Boolean)) || str(team?.logo),
      location: str(team?.location),
      record,
    },
    players,
  };
}

export async function loadPlayerProfile(id: string): Promise<NbaPlayerProfile> {
  const [athleteRaw, statsRaw, logRaw] = await Promise.all([
    espn(`/apis/site/v2/sports/basketball/nba/athletes/${id}`, 60 * 60_000),
    espnWeb(`/apis/common/v3/sports/basketball/nba/athletes/${id}/stats?season=2027&seasontype=2`, 20 * 60_000),
    espnWeb(`/apis/common/v3/sports/basketball/nba/athletes/${id}/gamelog?season=2027`, 10 * 60_000),
  ]);
  const athlete = obj(athleteRaw);
  if (!athlete) throw new Error("player unavailable");
  const stats = statRows(statsRaw);
  const log = obj(logRaw);
  const eventMap = obj(log?.events) ?? {};
  const labels = arr(log?.labels).map(str);
  const seasonTypes = arr(log?.seasonTypes);
  const gameRows = seasonTypes.flatMap((seasonType) => arr(obj(seasonType)?.categories).flatMap((category) => arr(obj(category)?.events)));
  const games = gameRows.flatMap((rawGame) => {
    const row = obj(rawGame);
    if (!row) return [];
    const eventId = str(row.eventId);
    const event = obj(eventMap[eventId]);
    if (!event) return [];
    const rawStats = arr(row.stats).map(str);
    const stats = labels.map((label, index) => ({ label, value: rawStats[index] ?? "" })).filter((item) => item.value);
    const opponent = str(obj(event.opponent)?.displayName) || str(obj(event.opponent)?.abbreviation);
    return [{ date: str(event.gameDate) || str(event.date), opponent, result: str(event.gameResult), stats }];
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  return {
    player: {
      id,
      name: str(athlete.displayName) || str(athlete.fullName),
      position: str(obj(athlete.position)?.displayName) || str(obj(athlete.position)?.abbreviation),
      team: str(obj(athlete.team)?.displayName),
      height: str(athlete.displayHeight),
      weight: str(athlete.displayWeight),
      age: num(athlete.age) != null ? String(athlete.age) : "",
      headshot: str(obj(athlete.headshot)?.href) || str(athlete.headshot),
    },
    season: profileStatSelection(stats),
    games,
  };
}
