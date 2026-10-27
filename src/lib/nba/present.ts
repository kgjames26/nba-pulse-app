import type { GameCard, GameStatus, Side } from "./types.ts";

export function showResultsFor(spoilers: boolean, revealedIds: string[], gameId: string): boolean {
  return spoilers || revealedIds.includes(gameId);
}

function hideSide(side: Side): Side {
  return { ...side, score: null, winner: false, lines: [] };
}

/** Drop anything that reveals a winner. Scheduled games have nothing to drop. */
export function presentGame(game: GameCard, show: boolean): GameCard {
  if (show) return game;
  if (game.status !== "in" && game.status !== "post") return game;
  return { ...game, clock: "", home: hideSide(game.home), away: hideSide(game.away) };
}

export function resultsAreHidden(status: GameStatus, show: boolean): boolean {
  return !show && (status === "in" || status === "post");
}
