export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createRoomWithHost, toLobbyError } from "@/lib/server/lobby-service";
import {
  LOBBY_SESSION_COOKIE_NAME,
  signLobbySession,
} from "@/lib/server/lobby-session";

const lobbySessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      playerId?: string;
      displayName?: string;
      avatar?: string;
    };
    const room = await createRoomWithHost(
      body.playerId ?? "",
      body.displayName ?? "",
      body.avatar ?? "",
    );

    const token = await signLobbySession({
      playerId: body.playerId ?? "",
      roomCode: room.code,
      displayName: body.displayName ?? "",
      isHost: true,
    });
    const response = NextResponse.json({ room });

    response.cookies.set({
      name: LOBBY_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: lobbySessionMaxAgeSeconds,
    });

    return response;
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
