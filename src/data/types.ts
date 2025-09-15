export interface TeamSummary {
  teamId: string;
  name: string;
  ownerName: string;
  avatar?: string;
  record?: { w: number; l: number; t?: number };
}

export interface MatchupSummary {
  matchupId: string;
  teamId: string;
  opponentTeamId: string;
  projected?: number;
  actual?: number;
}

export type GameStatus = "pre" | "in" | "post";

export interface GameContext {
  id: string;
  status: GameStatus;
  kickoff: string; // ISO
  venue?: { name?: string; lat?: number; lon?: number; indoor?: boolean };
  odds?: { spread?: number; total?: number; favorite?: string };
  weather?: { tempC?: number; windKph?: number; desc?: string };
}
