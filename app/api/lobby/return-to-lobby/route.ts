export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { returnRoomToLobby, toLobbyError } from "@/lib/server/lobby-service";
import { requireLobbySession } from "@/lib/server/lobby-session";
import { verifyRequestedRoomContext } from "@/lib/server/verify-room-session";

export async function POST(request: Request) {
  try {
    const session = await requireLobbySession();
    const body = (await request.json()) as {
      roomId?: string;
      roomCode?: string;
      playerId?: string;
    };

    await verifyRequestedRoomContext({
      roomId: body.roomId,
      roomCode: body.roomCode,
      sessionRoomCode: session.roomCode,
    });
    await returnRoomToLobby(body.roomId ?? "", session.playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
