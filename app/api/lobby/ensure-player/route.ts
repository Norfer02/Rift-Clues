import { NextResponse } from "next/server";
import { ensurePlayerMembership, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomCode?: string;
      playerId?: string;
      displayName?: string;
      avatar?: string;
    };
    const room = await ensurePlayerMembership(
      body.roomCode ?? "",
      body.playerId ?? "",
      body.displayName ?? "",
      body.avatar ?? "",
    );

    return NextResponse.json({ room });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
