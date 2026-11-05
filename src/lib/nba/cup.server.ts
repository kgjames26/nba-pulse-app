import { darkLogo, franchiseById, TEAMS } from "./teams.ts";
import { loadCupFeed } from "./espn.server.ts";
import type { CupData, CupGame, CupGroup, CupTeamStanding, GameCard } from "./types.ts";

type Conference = "east" | "west";
type MutableTeam = CupTeamStanding & { headToHead: Map<string, number> };
type GroupBucket = { conference: Conference; ids: string[]; labelHint: string | null };

const LABELS_2026: Record<string, string> = {
  "8,15,17,19,28": "A", "5,11,14,18,20": "B", "1,2,4,27,30": "C",
  "6,7,10,21,26": "A", "3,12,16,25,29": "B", "9,13,22,23,24": "C",
};

function playedPoints(game: GameCard, side: "home" | "away"): number {
  const score = game[side].score ?? 0;
  const overtimePoints = game[side].lines.slice(4).reduce((sum, value) => sum + value, 0);
  return score - overtimePoints;
}
function compareTeams(a: MutableTeam, b: MutableTeam, wildcard = false): number {
  if (a.wins !== b.wins) return b.wins - a.wins;
  if (!wildcard && a.headToHead.has(b.id) && b.headToHead.has(a.id)) {
    const h2h = (b.headToHead.get(a.id) ?? 0) - (a.headToHead.get(b.id) ?? 0);
    if (h2h) return h2h;
  }
  if (a.pointDiff !== b.pointDiff) return b.pointDiff - a.pointDiff;
  if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor;
  return a.name.localeCompare(b.name);
}
function isFinal(game: GameCard): boolean {
  return game.status === "post" && game.home.score != null && game.away.score != null;
}
function teamConference(id: string): Conference | null {
  return franchiseById(id)?.conference ?? null;
}
function inferGroups(groupEvents: Awaited<ReturnType<typeof loadCupFeed>>, seasonYear: number): GroupBucket[] {
  const edges = new Map<string, Set<string>>();
  for (const event of groupEvents) {
    const a = event.game.home.id;
    const b = event.game.away.id;
    if (!teamConference(a) || teamConference(a) !== teamConference(b)) continue;
    if (!edges.has(a)) edges.set(a, new Set());
    if (!edges.has(b)) edges.set(b, new Set());
    edges.get(a)?.add(b);
    edges.get(b)?.add(a);
  }
  const components: GroupBucket[] = [];
  const visited = new Set<string>();
  for (const id of edges.keys()) {
    if (visited.has(id)) continue;
    const queue = [id];
    const ids: string[] = [];
    visited.add(id);
    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      ids.push(current);
      for (const next of edges.get(current) ?? []) {
        if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
    }
    const conference = teamConference(id);
    if (conference && ids.length >= 2) components.push({ conference, ids, labelHint: null });
  }
  const groups: GroupBucket[] = [];
  for (const conference of ["east", "west"] as const) {
    const side = components.filter((group) => group.conference === conference)
      .sort((a, b) => groupName(a.ids).localeCompare(groupName(b.ids)));
    side.forEach((group, index) => {
      const official2026 = LABELS_2026[group.ids.map(Number).sort((a, b) => a - b).join(",")];
      groups.push({ ...group, labelHint: seasonYear === 2026 ? official2026 ?? String.fromCharCode(65 + index) : String(index + 1) });
    });
  }
  return groups;
}
function groupName(ids: string[]): string {
  return ids.map((id) => TEAMS.find((team) => team.id === id)?.name ?? id).sort()[0] ?? "";
}

export async function loadCup(seasonYear: number): Promise<CupData> {
  const feed = await loadCupFeed(seasonYear);
  const groupEvents = feed.filter((item) => item.stage === "group");
  const buckets = inferGroups(groupEvents, seasonYear);
  const groupByTeam = new Map<string, GroupBucket>();
  for (const group of buckets) for (const id of group.ids) groupByTeam.set(id, group);

  const groups: CupGroup[] = buckets.map((bucket) => {
    const teams: MutableTeam[] = bucket.ids.flatMap((id) => {
      const team = TEAMS.find((item) => item.id === id);
      return team ? [{
        id, abbr: team.abbr, name: team.name, logo: darkLogo(team.slug),
        played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0,
        headToHead: new Map<string, number>(),
      }] : [];
    });
    const byId = new Map(teams.map((team) => [team.id, team]));
    const games = groupEvents.map((item) => item.game).filter((game) => byId.has(game.home.id) && byId.has(game.away.id));
    for (const game of games) {
      const home = byId.get(game.home.id);
      const away = byId.get(game.away.id);
      if (!home || !away || !isFinal(game)) continue;
      const homeScore = game.home.score ?? 0;
      const awayScore = game.away.score ?? 0;
      const overtime = Math.max(game.home.lines.length, game.away.lines.length) > 4;
      const homePoints = playedPoints(game, "home");
      const awayPoints = playedPoints(game, "away");
      home.played += 1; away.played += 1;
      home.pointsFor += homePoints; home.pointsAgainst += awayPoints;
      away.pointsFor += awayPoints; away.pointsAgainst += homePoints;
      home.headToHead.set(away.id, home.headToHead.get(away.id) ?? 0);
      away.headToHead.set(home.id, away.headToHead.get(home.id) ?? 0);
      if (game.home.winner || homeScore > awayScore) {
        home.wins += 1; away.losses += 1;
        home.headToHead.set(away.id, (home.headToHead.get(away.id) ?? 0) + 1);
      } else {
        away.wins += 1; home.losses += 1;
        away.headToHead.set(home.id, (away.headToHead.get(home.id) ?? 0) + 1);
      }
      if (!overtime) { home.pointDiff += homeScore - awayScore; away.pointDiff += awayScore - homeScore; }
    }
    return {
      conference: bucket.conference,
      name: bucket.labelHint ?? "—",
      teams: teams.sort((a, b) => compareTeams(a, b)).map(({ headToHead: _headToHead, ...team }) => team),
    };
  });

  const cupGames: CupGame[] = [];
  const seen = new Set<string>();
  for (const item of feed) {
    if (seen.has(item.game.id)) continue;
    seen.add(item.game.id);
    if (item.stage === "group") {
      const a = groupByTeam.get(item.game.home.id);
      const b = groupByTeam.get(item.game.away.id);
      if (!a || a !== b) continue;
      cupGames.push({ conference: a.conference, group: a.labelHint, stage: "group", game: item.game });
    } else {
      const a = teamConference(item.game.home.id);
      const b = teamConference(item.game.away.id);
      cupGames.push({ conference: item.stage === "final" || a !== b ? "both" : a ?? b ?? "both", group: null, stage: item.stage, game: item.game });
    }
  }

  const dates = [...new Set(cupGames.filter((item) => item.stage === "group").map((item) => item.game.tipoff.slice(0, 10)))].sort();
  const nextYear = String(seasonYear + 1).slice(-2);
  return {
    season: seasonYear + "-" + nextYear,
    seasonYear,
    groupPlayDates: dates,
    games: cupGames.sort((a, b) => a.game.tipoff.localeCompare(b.game.tipoff)),
    groups,
    fetchedAt: new Date().toISOString(),
  };
}
