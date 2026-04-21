import { NextResponse } from "next/server";
import { startRoomGame, toLobbyError } from "@/lib/server/lobby-service";
import { requireLobbySession } from "@/lib/server/lobby-session";
import { verifyRequestedRoomContext } from "@/lib/server/verify-room-session";
import type { WordPoolLocale } from "@/data/lol-terms";

export async function POST(request: Request) {
  try {
    const session = await requireLobbySession();
    const body = (await request.json()) as {
      roomId?: string;
      roomCode?: string;
      playerId?: string;
      locale?: WordPoolLocale;
    };

    await verifyRequestedRoomContext({
      roomId: body.roomId,
      roomCode: body.roomCode,
      sessionRoomCode: session.roomCode,
    });
    await startRoomGame(body.roomId ?? "", session.playerId, body.locale ?? "en");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
