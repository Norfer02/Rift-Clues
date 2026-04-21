import "server-only";

import {
  createInitialSharedGameState,
  revealSharedGameCard,
  submitSharedSignal,
} from "@/lib/game";
import { getDefaultAvatarForRole, isAvatarValidForRole } from "@/lib/champion-avatars";
import { generateRoomCode } from "@/lib/room-code";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import type { WordPoolLocale } from "@/data/lol-terms";
import type {
  LobbyPlayer,
  RoomRecord,
  SharedGameState,
} from "@/types/lobby";

type PlayerSelectionPatch = Partial<
  Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
>;

type RandomizeResult = {
  assignedCount: number;
  waitingCount: number;
};

const lobbySlots = [
  { side: "blue" as const, role: "summoner" as const, slotIndex: 0 },
  { side: "blue" as const, role: "champion" as const, slotIndex: 0 },
  { side: "blue" as const, role: "champion" as const, slotIndex: 1 },
  { side: "blue" as const, role: "champion" as const, slotIndex: 2 },
  { side: "red" as const, role: "summoner" as const, slotIndex: 0 },
  { side: "red" as const, role: "champion" as const, slotIndex: 0 },
  { side: "red" as const, role: "champion" as const, slotIndex: 1 },
  { side: "red" as const, role: "champion" as const, slotIndex: 2 },
];

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

function ensureDisplayName(displayName: string) {
  const trimmedName = displayName.trim();

  if (!trimmedName) {
    throw new Error("Enter a display name first.");
  }

  if (trimmedName.length > 24) {
    throw new Error("Display name must be 24 characters or fewer.");
  }

  return trimmedName;
}

function ensurePlayerId(playerId: string) {
  const normalizedPlayerId = playerId.trim();

  if (!normalizedPlayerId) {
    throw new Error("Player id is required.");
  }

  return normalizedPlayerId;
}

function ensureRoomCode(roomCode: string) {
  const normalizedCode = roomCode.trim().toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
    throw new Error("Enter a valid 6-character room code.");
  }

  return normalizedCode;
}

async function fetchRoomByCode(code: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  return (data as RoomRecord | null) ?? null;
}

async function fetchRoomById(roomId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  return (data as RoomRecord | null) ?? null;
}

async function fetchPlayersByRoomId(roomId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer[] | null) ?? [];
}

async function fetchPlayerByRowId(playerRowId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("players")
    .select("*")
    .eq("id", playerRowId)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  return (data as LobbyPlayer | null) ?? null;
}

async function findPlayerRowsInRoom(roomId: string, playerId: string) {
  const { data, error } = await getSupabaseAdmin()
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

async function findExistingPlayerInRoom(roomId: string, playerId: string) {
  const matches = await findPlayerRowsInRoom(roomId, playerId);
  return matches[0] ?? null;
}

async function deletePlayerRowsByIds(playerRowIds: string[]) {
  if (playerRowIds.length === 0) {
    return;
  }

  const { error } = await getSupabaseAdmin()
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

  const [primaryPlayer, ...duplicatePlayers] = matches;

  await deletePlayerRowsByIds(duplicatePlayers.map((player) => player.id));

  return primaryPlayer;
}

async function fetchRemainingPlayersForHostTransfer(
  roomId: string,
  leavingPlayerId: string,
) {
  const { data, error } = await getSupabaseAdmin()
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

function shuffle<T>(items: T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = nextItems[index];
    nextItems[index] = nextItems[swapIndex];
    nextItems[swapIndex] = currentItem;
  }

  return nextItems;
}

async function ensureRoomHost(roomId: string, playerId: string) {
  const player = await findExistingPlayerInRoom(roomId, playerId);

  if (!player) {
    throw new Error("Player not found.");
  }

  if (!player.is_host) {
    throw new Error("Only the host can perform this action.");
  }

  return player;
}

async function ensurePlayerBelongsToRoom(roomId: string, playerId: string) {
  const player = await findExistingPlayerInRoom(roomId, playerId);

  if (!player) {
    throw new Error("Player not found.");
  }

  return player;
}

async function persistRoomGameState(roomId: string, gameState: SharedGameState) {
  const { error } = await getSupabaseAdmin()
    .from("rooms")
    .update({
      game_state: gameState,
    })
    .eq("id", roomId);

  if (error) {
    throw toLobbyError(error);
  }
}

async function updatePlayerSelectionByRowId(
  playerRowId: string,
  patch: PlayerSelectionPatch,
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

  const { error } = await getSupabaseAdmin()
    .from("players")
    .update(patch)
    .eq("id", playerRowId);

  if (error) {
    throw toLobbyError(error);
  }
}

async function ensurePlayerInRoom(
  room: RoomRecord,
  playerId: string,
  displayName: string,
  avatar: string,
  isHost: boolean,
) {
  const existingPlayer = await removeDuplicatePlayerRows(room.id, playerId);

  if (existingPlayer) {
    const nextPlayerStatus =
      existingPlayer.player_status ??
      (room.status === "playing" ? "spectator" : "active");

    const { error: updateError } = await getSupabaseAdmin()
      .from("players")
      .update({
        display_name: displayName,
        avatar,
        player_status: nextPlayerStatus,
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
      player_status: nextPlayerStatus,
      slot_index: existingPlayer.slot_index ?? null,
      is_host: existingPlayer.is_host || isHost,
    } as LobbyPlayer;
  }

  const { data, error } = await getSupabaseAdmin()
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

export async function createRoomWithHost(
  playerId: string,
  displayName: string,
  avatar: string,
) {
  const normalizedPlayerId = ensurePlayerId(playerId);
  const normalizedDisplayName = ensureDisplayName(displayName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    const { data, error } = await getSupabaseAdmin()
      .from("rooms")
      .insert([
        {
          code,
          status: "lobby",
          host_id: normalizedPlayerId,
        },
      ])
      .select()
      .single();

    if (error) {
      const duplicateCode =
        error.code === "23505" ||
        error.message.toLowerCase().includes("duplicate");

      if (duplicateCode) {
        continue;
      }

      throw toLobbyError(error);
    }

    const room = data as RoomRecord;
    await ensurePlayerInRoom(room, normalizedPlayerId, normalizedDisplayName, avatar, true);
    return room;
  }

  throw new Error("Unable to create a room right now.");
}

export async function ensurePlayerMembership(
  roomCode: string,
  playerId: string,
  displayName: string,
  avatar: string,
) {
  const normalizedCode = ensureRoomCode(roomCode);
  const normalizedPlayerId = ensurePlayerId(playerId);
  const normalizedDisplayName = ensureDisplayName(displayName);
  const room = await fetchRoomByCode(normalizedCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  await ensurePlayerInRoom(
    room,
    normalizedPlayerId,
    normalizedDisplayName,
    avatar,
    room.host_id === normalizedPlayerId,
  );

  return room;
}

export async function updatePlayerSelection(
  roomId: string,
  playerId: string,
  patch: PlayerSelectionPatch,
) {
  const room = await fetchRoomById(roomId);

  if (!room) {
    throw new Error("Room not found.");
  }

  const player = await ensurePlayerBelongsToRoom(roomId, playerId);
  await updatePlayerSelectionByRowId(player.id, patch, room.status);
}

export async function randomizeRoomTeams(
  roomId: string,
  actorPlayerId: string,
): Promise<RandomizeResult> {
  const room = await fetchRoomById(roomId);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== "lobby") {
    throw new Error("Selections are locked during the game.");
  }

  await ensureRoomHost(roomId, actorPlayerId);

  const roomPlayers = await fetchPlayersByRoomId(roomId);
  const assignablePlayers = roomPlayers.filter(
    (player) => player.player_status !== "spectator",
  );

  if (assignablePlayers.length === 0) {
    return {
      assignedCount: 0,
      waitingCount: 0,
    };
  }

  const shuffledSlots = shuffle(lobbySlots);
  const shuffledPlayers = shuffle(assignablePlayers);
  const assignments = shuffledPlayers.slice(0, shuffledSlots.length);

  for (const player of shuffledPlayers) {
    await updatePlayerSelectionByRowId(
      player.id,
      {
        side: null,
        role: null,
        slot_index: null,
        player_status: "active",
      },
      room.status,
    );
  }

  for (let index = 0; index < assignments.length; index += 1) {
    const player = assignments[index];
    const slot = shuffledSlots[index];
    const nextAvatar = isAvatarValidForRole(player.avatar, slot.role)
      ? player.avatar
      : getDefaultAvatarForRole(slot.role);

    await updatePlayerSelectionByRowId(
      player.id,
      {
        side: slot.side,
        role: slot.role,
        slot_index: slot.slotIndex,
        avatar: nextAvatar,
        player_status: "active",
      },
      room.status,
    );
  }

  return {
    assignedCount: assignments.length,
    waitingCount: Math.max(shuffledPlayers.length - assignments.length, 0),
  };
}

export async function startRoomGame(
  roomId: string,
  actorPlayerId: string,
  locale: WordPoolLocale = "en",
) {
  const room = await fetchRoomById(roomId);

  if (!room) {
    throw new Error("Room not found.");
  }

  await ensureRoomHost(roomId, actorPlayerId);

  const gameState = createInitialSharedGameState(locale);

  const { error } = await getSupabaseAdmin()
    .from("rooms")
    .update({
      game_state: gameState,
      status: "playing",
    })
    .eq("id", roomId);

  if (error) {
    throw toLobbyError(error);
  }
}

export async function submitRoomSignal(
  roomId: string,
  actorPlayerId: string,
  clue: { word: string; number: number },
) {
  const room = await fetchRoomById(roomId);

  if (!room || room.status !== "playing" || !room.game_state) {
    throw new Error("Room not found.");
  }

  const player = await ensurePlayerBelongsToRoom(roomId, actorPlayerId);

  if (
    player.player_status === "spectator" ||
    player.role !== "summoner" ||
    player.side !== room.game_state.activeSide
  ) {
    throw new Error("You cannot submit a signal right now.");
  }

  if (room.game_state.currentSignal !== null || room.game_state.status === "finished") {
    throw new Error("You cannot submit a signal right now.");
  }

  const nextState = submitSharedSignal(room.game_state, clue);
  await persistRoomGameState(roomId, nextState);
}

export async function revealRoomCard(
  roomId: string,
  actorPlayerId: string,
  cardId: string,
) {
  const room = await fetchRoomById(roomId);

  if (!room || room.status !== "playing" || !room.game_state) {
    throw new Error("Room not found.");
  }

  const player = await ensurePlayerBelongsToRoom(roomId, actorPlayerId);

  if (
    player.player_status === "spectator" ||
    player.role !== "champion" ||
    player.side !== room.game_state.activeSide ||
    room.game_state.currentSignal === null
  ) {
    throw new Error("You cannot reveal a card right now.");
  }

  const nextState = revealSharedGameCard(room.game_state, cardId);
  await persistRoomGameState(roomId, nextState);
}

export async function returnRoomToLobby(roomId: string, actorPlayerId: string) {
  const room = await fetchRoomById(roomId);

  if (!room) {
    throw new Error("Room not found.");
  }

  await ensureRoomHost(roomId, actorPlayerId);

  const { error } = await getSupabaseAdmin()
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

export async function leaveRoom(roomId: string, playerId: string) {
  const normalizedPlayerId = ensurePlayerId(playerId);
  const player = await ensurePlayerBelongsToRoom(roomId, normalizedPlayerId);
  const remainingPlayers = player.is_host
    ? await fetchRemainingPlayersForHostTransfer(roomId, normalizedPlayerId)
    : [];

  const { error: deleteMembershipError } = await getSupabaseAdmin()
    .from("players")
    .delete()
    .eq("room_id", roomId)
    .eq("player_id", normalizedPlayerId);

  if (deleteMembershipError) {
    throw toLobbyError(deleteMembershipError);
  }

  const filteredRemainingPlayers = remainingPlayers.filter(
    (remainingPlayer) => remainingPlayer.player_id !== normalizedPlayerId,
  );

  if (!player.is_host || filteredRemainingPlayers.length === 0) {
    return;
  }

  const nextHost = filteredRemainingPlayers[0];

  const { error: clearHostsError } = await getSupabaseAdmin()
    .from("players")
    .update({
      is_host: false,
    })
    .eq("room_id", roomId);

  if (clearHostsError) {
    throw toLobbyError(clearHostsError);
  }

  const { error: promoteHostError } = await getSupabaseAdmin()
    .from("players")
    .update({
      is_host: true,
    })
    .eq("id", nextHost.id);

  if (promoteHostError) {
    throw toLobbyError(promoteHostError);
  }

  const { error: roomUpdateError } = await getSupabaseAdmin()
    .from("rooms")
    .update({
      host_id: nextHost.player_id,
    })
    .eq("id", roomId);

  if (roomUpdateError) {
    throw toLobbyError(roomUpdateError);
  }
}
