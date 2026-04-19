import type { TranslationMessage } from "@/lib/i18n-types";
import type { ActiveClue, GameCard, Team } from "@/types/game";

export type RoomStatus = "lobby" | "playing" | "finished";
export type LobbySide = "blue" | "red" | null;
export type LobbyRole = "summoner" | "champion" | null;
export type LobbyPlayerStatus = "active" | "spectator";

export type SharedGameState = {
  status: "playing" | "finished";
  cards: GameCard[];
  activeSide: Team;
  startingSide: Team;
  startingSideBonusUsed: boolean;
  currentSignal: ActiveClue | null;
  picksRemaining: number | null;
  gameOver: boolean;
  winner: Team | null;
  loser: Team | null;
  endReason: "victory" | "gank" | null;
  message: TranslationMessage;
};

export type RoomRecord = {
  id: string;
  code: string;
  status: RoomStatus;
  host_id: string | null;
  created_at?: string;
  game_state?: SharedGameState | null;
};

export type LobbyPlayer = {
  id: string;
  room_id: string;
  player_id: string;
  display_name: string;
  avatar: string | null;
  player_status: LobbyPlayerStatus;
  side: LobbySide;
  role: LobbyRole;
  slot_index: number | null;
  is_host: boolean;
  created_at?: string;
};
