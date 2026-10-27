export type GameStatus = "pre" | "in" | "post" | "postponed" | "canceled" | "delayed" | "other";

export type Side = {
  id: string;
  abbr: string;
  name: string;
  short: string;
  logo: string;
  logoAlt: string;
  color: string;
  score: number | null;
  winner: boolean;
  lines: number[];
};

export type GameCard = {
  id: string;
  tipoff: string;
  status: GameStatus;
  rawName: string;
  period: number;
  clock: string;
  completed: boolean;
  home: Side;
  away: Side;
  nationalTv: boolean;
  nationalNames: string[];
  broadcasts: string[];
  titleWeight: number;
  venue: string | null;
};

export type PlayerLine = {
  id: string;
  name: string;
  jersey: string;
  pos: string;
  starter: boolean;
  dnp: boolean;
  reason: string;
  min: string;
  pts: string;
  reb: string;
  ast: string;
  stl: string;
  blk: string;
  fg: string;
  tp: string;
  ft: string;
  pm: string;
};

export type Clip = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  duration: number;
  player: string | null;
  kind: "play" | "package";
};

export type OddsView = {
  provider: string;
  fetchedAt: string;
  homeAmerican: number;
  awayAmerican: number;
  homeProb: number;
  awayProb: number;
};

export type Injury = {
  athleteId: string;
  name: string;
  team: string;
  teamId: string;
  status: string;
  detail: string;
};

export type Leader = {
  stat: "pts" | "reb" | "ast";
  name: string;
  athleteId: string;
  teamId: string;
  team: string;
  value: string;
  position: string;
};

export type Slate = {
  date: string;
  season: string;
  phase: string;
  games: GameCard[];
  fetchedAt: string;
};

export type GameDetail = {
  game: GameCard;
  attendance: number | null;
  box: { teamId: string; players: PlayerLine[] }[];
  clips: Clip[];
  odds: OddsView | null;
  injuries: Injury[];
  leaders: Leader[];
  fetchedAt: string;
};

export type StandingRow = {
  id: string;
  name: string;
  abbr: string;
  logo: string;
  wins: string;
  losses: string;
  pct: string;
  gb: string;
  streak: string;
  seed: string;
};

export type Standings = {
  season: string;
  phase: string;
  east: StandingRow[];
  west: StandingRow[];
  fetchedAt: string;
};

export type DuelCopy = { title: string; body: string };

export type SourceLink = { title: string; url: string };

export type Tactic = {
  lead: string;
  winner: string;
  loser: string;
  worked: string;
  failed: string;
  sources: SourceLink[];
};

export type Narrative =
  | { mode: "desk"; text: string; duels: DuelCopy[]; tactic?: Tactic }
  | { mode: "stat" };
