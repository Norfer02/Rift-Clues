import { createInitialSharedGameState } from "@/lib/game";
import { supabase } from "@/lib/supabase";
import type { WordPoolLocale } from "@/data/lol-terms";
import type { LobbyPlayer, LobbyRole, LobbySide, RoomRecord, SharedGameState } from "@/types/lobby";

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

export async function createRoom(code: string, hostId: string) {
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        code,
        status: "lobby",
        host_id: hostId,
      },
    ])
    .select()
    .single();

  console.log("ROOM DATA:", data);
  console.log("ROOM ERROR MESSAGE:", error?.message);
  console.log("ROOM ERROR DETAILS:", error?.details);
  console.log("ROOM ERROR HINT:", error?.hint);
  console.log("ROOM ERROR CODE:", error?.code);

  if (error) {
    throw toLobbyError(
      error.message ||
        error.details ||
        error.hint ||
        "Unknown room creation error",
    );
  }

  return data as RoomRecord;
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

async function fetchPlayerByRowId(playerRowId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerRowId)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer | null) ?? null;
}

async function findExistingPlayerInRoom(
  roomId: string,
  playerId: string,
) {
  const matches = await findPlayerRowsInRoom(roomId, playerId);
  return matches[0] ?? null;
}

async function findPlayerRowsInRoom(
  roomId: string,
  playerId: string,
) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .eq("player_id", playerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer[] | null) ?? [];
}

async function deletePlayerRowsByIds(playerRowIds: string[]) {
  if (playerRowIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .in("id", playerRowIds);

  if (error) {
    throw toLobbyError(error);
  }
}

async function removeDuplicatePlayerRows(roomId: string, playerId: string) {
  const matches = await findPlayerRowsInRoom(roomId, playerId);

  if (matches.length <= 1) {
    return matches[0] ?? null;
  }

  console.log("DUPLICATE PLAYER ROWS FOUND:", {
    roomId,
    playerId,
    duplicateCount: matches.length,
  });

  const [primaryPlayer, ...duplicatePlayers] = matches;

  await deletePlayerRowsByIds(duplicatePlayers.map((player) => player.id));

  return primaryPlayer;
}

async function fetchRemainingPlayersForHostTransfer(
  roomId: string,
  leavingPlayerId: string,
) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .neq("player_id", leavingPlayerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer[] | null) ?? [];
}

export async function ensurePlayerInRoom(
  room: RoomRecord,
  playerId: string,
  displayName: string,
  avatar: string,
  isHost: boolean,
) {
  const existingPlayer = await removeDuplicatePlayerRows(room.id, playerId);

  if (existingPlayer) {
    console.log("REUSING EXISTING PLAYER MEMBERSHIP:", {
      roomId: room.id,
      playerId,
      playerRowId: existingPlayer.id,
      playerStatus: existingPlayer.player_status,
    });

    const { error: updateError } = await supabase
      .from("players")
      .update({
      display_name: displayName,
      avatar,
      player_status:
        existingPlayer.player_status ??
        (room.status === "playing" ? "spectator" : "active"),
      slot_index: existingPlayer.slot_index ?? null,
      is_host: existingPlayer.is_host || isHost,
    })
    .eq("id", existingPlayer.id);

    if (updateError) {
      throw toLobbyError(updateError);
    }

    return {
      ...existingPlayer,
      display_name: displayName,
      avatar,
      player_status:
        existingPlayer.player_status ??
        (room.status === "playing" ? "spectator" : "active"),
      slot_index: existingPlayer.slot_index ?? null,
      is_host: existingPlayer.is_host || isHost,
    } as LobbyPlayer;
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      player_id: playerId,
      display_name: displayName,
      avatar,
      player_status: room.status === "playing" ? "spectator" : "active",
      side: null,
      role: null,
      slot_index: null,
      is_host: isHost,
    })
    .select()
    .single();

  if (error) {
    const fallbackPlayer = await findExistingPlayerInRoom(room.id, playerId);
    if (fallbackPlayer) {
      return fallbackPlayer;
    }

    throw toLobbyError(error);
  }

  return data as LobbyPlayer;
}

export async function updatePlayerSelection(
  playerRowId: string,
  patch: Partial<
    Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
  >,
  roomStatus: RoomRecord["status"],
) {
  if (roomStatus !== "lobby") {
    throw new Error("Selections are locked during the game.");
  }

  const currentPlayer = await fetchPlayerByRowId(playerRowId);

  if (!currentPlayer) {
    throw new Error("Player not found.");
  }

  const nextSide = patch.side ?? currentPlayer.side;
  const nextRole = patch.role ?? currentPlayer.role;
  const nextSlotIndex = patch.slot_index ?? currentPlayer.slot_index;

  if (nextRole === "summoner" && nextSlotIndex !== 0) {
    throw new Error("Summoner slots must use slot 1.");
  }

  if (
    nextRole === "champion" &&
    (nextSlotIndex === null || nextSlotIndex < 0 || nextSlotIndex > 2)
  ) {
    throw new Error("Champion slots must use a valid seat.");
  }

  if (nextSide && nextRole !== null && nextSlotIndex !== null) {
    const roomPlayers = await fetchPlayersByRoomId(currentPlayer.room_id);
    const occupiedByOtherPlayer = roomPlayers.some(
      (player) =>
        player.id !== currentPlayer.id &&
        player.side === nextSide &&
        player.role === nextRole &&
        player.slot_index === nextSlotIndex,
    );

    if (occupiedByOtherPlayer) {
      throw new Error("That slot is already taken.");
    }
  }

  const { error } = await supabase
    .from("players")
    .update(patch)
    .eq("id", playerRowId);

  if (error) {
    throw toLobbyError(error);
  }
}

export async function updateRoomStatus(roomId: string, status: RoomRecord["status"]) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status,
    })
    .eq("id", roomId);

  if (error) {
    throw toLobbyError(error);
  }
}

export async function startSharedRoomGame(
  roomId: string,
  locale: WordPoolLocale = "en",
) {
  const gameState: SharedGameState = createInitialSharedGameState(locale);

  const { error: gameStateError } = await supabase
    .from("rooms")
    .update({
      game_state: gameState,
    })
    .eq("id", roomId);

  if (gameStateError) {
    throw toLobbyError(gameStateError);
  }

  const { data: savedRoom, error: fetchError } = await supabase
    .from("rooms")
    .select("game_state")
    .eq("id", roomId)
    .single();

  if (fetchError) {
    throw toLobbyError(fetchError);
  }

  if (!savedRoom?.game_state) {
    throw new Error("Game state was not saved correctly.");
  }

  const { error: statusError } = await supabase
    .from("rooms")
    .update({
      status: "playing",
    })
    .eq("id", roomId);

  if (statusError) {
    throw toLobbyError(statusError);
  }
}

export async function updateRoomGameState(
  roomId: string,
  gameState: SharedGameState,
) {
  const { error } = await supabase
    .from("rooms")
    .update({
      game_state: gameState,
    })
    .eq("id", roomId);

  if (error) {
    throw toLobbyError(error);
  }
}

export async function returnRoomToLobby(roomId: string) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "lobby",
      game_state: null,
    })
    .eq("id", roomId);

  if (error) {
    throw toLobbyError(error);
  }
}

export async function leaveRoom(
  roomId: string,
  player: Pick<LobbyPlayer, "id" | "player_id" | "is_host">,
) {
  const remainingPlayers = player.is_host
    ? await fetchRemainingPlayersForHostTransfer(roomId, player.player_id)
    : [];

  console.log("LEAVE ROOM DELETE START:", {
    roomId,
    playerId: player.player_id,
  });

  const { data: deletedMembershipRows, error: deleteMembershipError } = await supabase
    .from("players")
    .delete()
    .eq("room_id", roomId)
    .eq("player_id", player.player_id)
    .select("id, room_id, player_id");

  console.log("LEAVE ROOM DELETE RESULT:", deletedMembershipRows);
  console.log("LEAVE ROOM DELETE ERROR:", deleteMembershipError);

  if (deleteMembershipError) {
    throw toLobbyError(deleteMembershipError);
  }

  const filteredRemainingPlayers = remainingPlayers.filter(
    (remainingPlayer) => remainingPlayer.player_id !== player.player_id,
  );

  if (!player.is_host || filteredRemainingPlayers.length === 0) {
    return;
  }

  const nextHost = filteredRemainingPlayers[0];

  const { error: clearHostsError } = await supabase
    .from("players")
    .update({
      is_host: false,
    })
    .eq("room_id", roomId);

  if (clearHostsError) {
    throw toLobbyError(clearHostsError);
  }

  const { error: promoteHostError } = await supabase
    .from("players")
    .update({
      is_host: true,
    })
    .eq("id", nextHost.id);

  if (promoteHostError) {
    throw toLobbyError(promoteHostError);
  }

  const { error: roomUpdateError } = await supabase
    .from("rooms")
    .update({
      host_id: nextHost.player_id,
    })
    .eq("id", roomId);

  if (roomUpdateError) {
    throw toLobbyError(roomUpdateError);
  }
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
