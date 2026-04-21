import { supabase } from "@/lib/supabase";
import type { LobbyPlayer, LobbyRole, LobbySide, RoomRecord } from "@/types/lobby";

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function toLobbyError(error: unknown) {
  return new Error(errorMessage(error));
}

export async function fetchRoomByCode(code: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  return (data as RoomRecord | null) ?? null;
}

export async function fetchPlayersByRoomId(roomId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId);

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer[]) ?? [];
}

export function sortLobbyPlayers(players: LobbyPlayer[]) {
  return [...players].sort((a, b) => {
    if (a.is_host !== b.is_host) {
      return a.is_host ? -1 : 1;
    }

    if (a.player_status !== b.player_status) {
      return a.player_status === "active" ? -1 : 1;
    }

    if (a.side !== b.side) {
      if (a.side === "blue") {
        return -1;
      }

      if (b.side === "blue") {
        return 1;
      }
    }

    if (a.role !== b.role) {
      if (a.role === "summoner") {
        return -1;
      }

      if (b.role === "summoner") {
        return 1;
      }
    }

    if ((a.slot_index ?? 0) !== (b.slot_index ?? 0)) {
      return (a.slot_index ?? 0) - (b.slot_index ?? 0);
    }

    return a.display_name.localeCompare(b.display_name);
  });
}

export type { LobbyRole, LobbySide };
