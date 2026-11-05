import { darkLogo, TEAMS } from "./teams.ts";
import { loadSlate } from "./espn.server.ts";
import type { CupData, CupGame, CupGroup, CupTeamStanding, GameCard } from "./types.ts";

const GROUP_PLAY_DATES = ["20261030", "20261106", "20261113", "20261120", "20261124", "20261125", "20261127"];
const GROUPS: { conference: "east" | "west"; name: "A" | "B" | "C"; ids: string[] }[] = [
  { conference: "east", name: "A", ids: ["17", "8", "15", "19", "28"] },
  { conference: "east", name: "B", ids: ["5", "11", "14", "18", "20"] },
  { conference: "east", name: "C", ids: ["1", "2", "30", "4", "27"] },
  { conference: "west", name: "A", ids: ["6", "7", "10", "21", "26"] },
  { conference: "west", name: "B", ids: ["12", "29", "16", "3", "25"] },
  { conference: "west", name: "C", ids: ["9", "13", "22", "23", "24"] },
];

type MutableTeam = CupTeamStanding & { headToHead: Map<string, number> };

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

export async function loadCup(): Promise<CupData> {
  const slates = await Promise.all(GROUP_PLAY_DATES.map((date) => loadSlate(date)));
  const games = slates.flatMap((slate) => slate.games).filter((game, index, all) => all.findIndex((item) => item.id === game.id) === index);
  const cupGames: CupGame[] = [];

  const groups: CupGroup[] = GROUPS.map((group) => {
    const teams: MutableTeam[] = group.ids.flatMap((id) => {
      const team = TEAMS.find((item) => item.id === id);
      return team ? [{
        id, abbr: team.abbr, name: team.name, logo: darkLogo(team.slug),
        played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0,
        headToHead: new Map<string, number>(),
      }] : [];
    });
    const byId = new Map(teams.map((team) => [team.id, team]));
    for (const game of games) {
      const home = byId.get(game.home.id);
      const away = byId.get(game.away.id);
      if (!home || !away) continue;
      cupGames.push({ conference: group.conference, group: group.name, game });
      if (!isFinal(game)) continue;
      const homeScore = game.home.score ?? 0;
      const awayScore = game.away.score ?? 0;
      const overtime = Math.max(game.home.lines.length, game.away.lines.length) > 4;
      const homePoints = playedPoints(game, "home");
      const awayPoints = playedPoints(game, "away");
      home.played += 1;
      away.played += 1;
      home.pointsFor += homePoints;
      home.pointsAgainst += awayPoints;
      away.pointsFor += awayPoints;
      away.pointsAgainst += homePoints;
      home.headToHead.set(away.id, home.headToHead.get(away.id) ?? 0);
      away.headToHead.set(home.id, away.headToHead.get(home.id) ?? 0);
      if (game.home.winner || homeScore > awayScore) {
        home.wins += 1;
        away.losses += 1;
        home.headToHead.set(away.id, (home.headToHead.get(away.id) ?? 0) + 1);
      } else {
        away.wins += 1;
        home.losses += 1;
        away.headToHead.set(home.id, (away.headToHead.get(home.id) ?? 0) + 1);
      }
      if (!overtime) {
        home.pointDiff += homeScore - awayScore;
        away.pointDiff += awayScore - homeScore;
      }
    }
    return {
      conference: group.conference,
      name: group.name,
      teams: teams.sort((a, b) => compareTeams(a, b)).map(({ headToHead: _headToHead, ...team }) => team),
    };
  });

  const uniqueGames = [...new Map(cupGames.map((item) => [item.game.id, item])).values()]
    .sort((a, b) => a.game.tipoff.localeCompare(b.game.tipoff));
  return {
    season: "2026-27",
    groupPlayDates: GROUP_PLAY_DATES,
    games: uniqueGames,
    groups,
    fetchedAt: new Date().toISOString(),
  };
}
