export type GameScreen =
  | 'HOME'
  | 'TOSS_CHOICE'
  | 'TOSS_PLAY'
  | 'TOSS_RESULT'
  | 'BAT_BOWL_DECISION'
  | 'INNINGS_1'
  | 'INNINGS_BREAK'
  | 'INNINGS_2'
  | 'MATCH_RESULT';

export type TossParity = 'ODD' | 'EVEN';
export type Participant = 'PLAYER' | 'BOT';
export type MatchWinner = 'PLAYER' | 'BOT' | 'TIE';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type BotExpression =
  | 'neutral'
  | 'thinking'
  | 'happy'
  | 'surprised'
  | 'confident'
  | 'disappointed';

export interface BallRecord {
  player: number;
  bot: number;
  runs: number;
  isOut: boolean;
  battingSide: Participant;
}

export interface MatchState {
  playerTossChoice: TossParity | null;
  botTossChoice: TossParity | null;
  tossPlayerNum: number | null;
  tossBotNum: number | null;
  tossWinner: Participant | null;
  firstBatter: Participant | null;
  innings: 1 | 2;
  battingSide: Participant | null;
  playerScore: number;
  playerWickets: number;
  playerBalls: number;
  botScore: number;
  botWickets: number;
  botBalls: number;
  target: number | null;
  lastBall: { player: number; bot: number } | null;
  lastResult: string;
  ballHistory: BallRecord[];
  playerPastNumbers: number[];
  winner: MatchWinner | null;
  summary: string;
}

export interface GameSettings {
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  webcamEnabled: boolean;
  difficulty: DifficultyLevel;
}

export interface RevealedPair {
  player: number;
  bot: number;
  label: string;
  type: 'runs' | 'big' | 'out' | 'win' | 'lose';
}
