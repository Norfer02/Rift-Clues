import type { WordPoolLocale } from "@/data/lol-terms";
import type { LobbyPlayer } from "@/types/lobby";

type PostOptions = {
  keepalive?: boolean;
};

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
  options: PostOptions = {},
) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    keepalive: options.keepalive,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | TResponse
    | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Unknown error";

    throw new Error(message);
  }

  return payload as TResponse;
}

export async function apiCreateRoom(input: {
  playerId: string;
  displayName: string;
  avatar: string;
}) {
  return postJson<{ room: { code: string } & Record<string, unknown> }>(
    "/api/lobby/create-room",
    input,
  );
}

export async function apiJoinRoom(input: {
  roomCode: string;
  playerId: string;
  displayName: string;
  avatar: string;
}) {
  return postJson<{ room: { code: string } & Record<string, unknown> }>(
    "/api/lobby/join-room",
    input,
  );
}

export async function apiEnsurePlayer(input: {
  roomCode: string;
  playerId: string;
  displayName: string;
  avatar: string;
}) {
  return postJson<{ room: { id: string } & Record<string, unknown> }>(
    "/api/lobby/ensure-player",
    input,
  );
}

export async function apiUpdatePlayerSelection(input: {
  roomId: string;
  playerId: string;
  patch: Partial<
    Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
  >;
}) {
  return postJson<{ ok: true }>("/api/lobby/update-selection", input);
}

export async function apiRandomizeTeams(input: {
  roomId: string;
  playerId: string;
}) {
  return postJson<{ assignedCount: number; waitingCount: number }>(
    "/api/lobby/randomize-teams",
    input,
  );
}

export async function apiStartGame(input: {
  roomId: string;
  playerId: string;
  locale: WordPoolLocale;
}) {
  return postJson<{ ok: true }>("/api/lobby/start-game", input);
}

export async function apiLeaveRoom(
  input: {
    roomId: string;
    playerId: string;
  },
  options: PostOptions = {},
) {
  return postJson<{ ok: true }>("/api/lobby/leave-room", input, options);
}

export async function apiSubmitSignal(input: {
  roomId: string;
  playerId: string;
  clue: {
    word: string;
    number: number;
  };
}) {
  return postJson<{ ok: true }>("/api/lobby/submit-signal", input);
}

export async function apiRevealCard(input: {
  roomId: string;
  playerId: string;
  cardId: string;
}) {
  return postJson<{ ok: true }>("/api/lobby/reveal-card", input);
}

export async function apiReturnRoomToLobby(input: {
  roomId: string;
  playerId: string;
}) {
  return postJson<{ ok: true }>("/api/lobby/return-to-lobby", input);
}
