import type { TranslationMessage } from "@/lib/i18n-types";

export type CardRole = "blue" | "red" | "neutral" | "assassin";
export type ViewMode = "player" | "spymaster";
export type Team = "blue" | "red";
export type PlayerRole = "spymaster" | "operative";
export type GameStage = "landing" | "setup" | "playing";

export type GameCard = {
  id: string;
  word: string;
  role: CardRole;
  revealed: boolean;
  revealedImage?: string | null;
};

export type GameStatus = {
  activeTeam: Team;
  winner: Team | null;
  loser: Team | null;
  gameOver: boolean;
  endReason?: "victory" | "gank" | null;
  message: TranslationMessage;
};

export type ActiveClue = {
  word: string;
  number: number;
};

export type PlayerSelection = {
  team: Team;
  role: PlayerRole;
};
