import { percentPair } from "./odds.ts";
import {
  absenceProse,
  duelProse,
  halfLeaderName,
  otPeriods,
  recapProse,
  scoreLine,
  type Absence,
  type DuelFact,
  type RecapFacts,
} from "./prose.ts";
import type { DuelCopy, GameDetail } from "./types.ts";
import type { Lang } from "./i18n.ts";

function pointsOf(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : -1;
}

export function recapFacts(detail: GameDetail): RecapFacts | null {
  const { game } = detail;
  if (game.status !== "post") return null;
  if (game.away.score == null || game.home.score == null) return null;
  const awayScore = game.away.score;
  const homeScore = game.home.score;
  const winner = awayScore === homeScore ? "" : awayScore > homeScore ? game.away.name : game.home.name;
  const loser = awayScore === homeScore ? "" : awayScore > homeScore ? game.home.name : game.away.name;
  const players = detail.box
    .flatMap((group) =>
      group.players
        .filter((player) => !player.dnp && pointsOf(player.pts) >= 0)
        .map((player) => ({
          name: player.name,
          team: group.teamId === game.home.id ? game.home.name : game.away.name,
          pts: player.pts,
          reb: player.reb,
          ast: player.ast,
          fg: player.fg,
          sort: pointsOf(player.pts),
        })),
    )
    .sort((a, b) => b.sort - a.sort)
    .slice(0, 3);
  return {
    awayName: game.away.name,
    homeName: game.home.name,
    awayScore,
    homeScore,
    winner,
    loser,
    margin: Math.abs(awayScore - homeScore),
    ot: otPeriods(game.away.lines, game.home.lines),
    halfLeader: halfLeaderName(game.away.lines, game.home.lines, game.away.name, game.home.name),
    tops: players.map(({ sort: _sort, ...rest }) => rest),
    venue: game.venue,
    attendance: detail.attendance,
  };
}

function isOut(status: string): boolean {
  return status.toLowerCase() === "out";
}

export function duelFacts(detail: GameDetail): DuelFact[] {
  const out = new Set(detail.injuries.filter((item) => isOut(item.status)).map((item) => item.athleteId));
  const leaders = detail.leaders.filter((leader) => leader.athleteId && !out.has(leader.athleteId));
  const stats: DuelFact["stat"][] = ["pts", "reb", "ast"];
  const duels: DuelFact[] = [];
  for (const stat of stats) {
    const home = leaders.find((leader) => leader.stat === stat && leader.teamId === detail.game.home.id);
    const away = leaders.find((leader) => leader.stat === stat && leader.teamId === detail.game.away.id);
    if (!home || !away) continue;
    if (home.athleteId === away.athleteId) continue;
    duels.push({
      stat,
      a: away.name,
      aTeam: away.team,
      aVal: away.value,
      b: home.name,
      bTeam: home.team,
      bVal: home.value,
    });
  }
  return duels;
}

export function absencesOf(detail: GameDetail): Absence[] {
  return detail.injuries
    .filter((item) => item.status)
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      team: item.team,
      status: item.status,
      detail: item.detail,
    }));
}

export function statReading(lang: Lang, detail: GameDetail): { text: string; scoreLine: string; duels: DuelCopy[]; absences: string } {
  const facts = recapFacts(detail);
  const duels = duelFacts(detail).map((duel) => duelProse(lang, duel));
  return {
    text: facts ? recapProse(lang, facts) : "",
    scoreLine: facts ? scoreLine(facts) : "",
    duels,
    absences: absenceProse(lang, absencesOf(detail)),
  };
}

export function modelFacts(detail: GameDetail): Record<string, unknown> {
  const facts = recapFacts(detail);
  const probs = detail.odds ? percentPair(detail.odds.homeProb, detail.odds.awayProb) : null;
  return {
    away: detail.game.away.name,
    home: detail.game.home.name,
    awayScore: facts?.awayScore ?? null,
    homeScore: facts?.homeScore ?? null,
    winner: facts?.winner || null,
    loser: facts?.loser || null,
    margin: facts?.margin ?? null,
    overtime: facts?.ot ?? 0,
    halftimeLeader: facts?.halfLeader ?? null,
    venue: detail.game.venue,
    attendance: detail.attendance,
    topScorers: facts?.tops ?? [],
    quarterAway: detail.game.away.lines,
    quarterHome: detail.game.home.lines,
    seasonLeaders: duelFacts(detail),
    injuries: absencesOf(detail),
    homeWinPercent: probs?.home ?? null,
    awayWinPercent: probs?.away ?? null,
    oddsProvider: detail.odds?.provider ?? null,
  };
}
