import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const LOBBY_SESSION_COOKIE_NAME = "rift_lobby_session";

export type LobbySessionPayload = {
  playerId: string;
  roomCode: string;
  displayName: string;
  isHost?: boolean;
};

export function getLobbySessionSecret(): Uint8Array {
  const secret = process.env.LOBBY_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "Missing LOBBY_SESSION_SECRET. Add it to the server environment before using lobby sessions.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signLobbySession(
  payload: LobbySessionPayload,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getLobbySessionSecret());
}

export async function verifyLobbySession(
  token: string,
): Promise<LobbySessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getLobbySessionSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.playerId !== "string" ||
      typeof payload.roomCode !== "string" ||
      typeof payload.displayName !== "string"
    ) {
      return null;
    }

    if (
      payload.isHost !== undefined &&
      typeof payload.isHost !== "boolean"
    ) {
      return null;
    }

    return {
      playerId: payload.playerId,
      roomCode: payload.roomCode,
      displayName: payload.displayName,
      isHost: payload.isHost,
    };
  } catch {
    return null;
  }
}

export async function getLobbySession(): Promise<LobbySessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOBBY_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyLobbySession(token);
}

export async function requireLobbySession(): Promise<LobbySessionPayload> {
  const session = await getLobbySession();

  if (!session) {
    throw new Error("Unauthorized: missing or invalid lobby session");
  }

  return session;
}
