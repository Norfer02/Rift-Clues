import { NextResponse } from "next/server";
import { submitRoomSignal, toLobbyError } from "@/lib/server/lobby-service";
import { requireLobbySession } from "@/lib/server/lobby-session";
import { verifyRequestedRoomContext } from "@/lib/server/verify-room-session";

export async function POST(request: Request) {
  try {
    const session = await requireLobbySession();
    const body = (await request.json()) as {
      roomId?: string;
      roomCode?: string;
      playerId?: string;
      clue?: {
        word: string;
        number: number;
      };
    };

    await verifyRequestedRoomContext({
      roomId: body.roomId,
      roomCode: body.roomCode,
      sessionRoomCode: session.roomCode,
    });
    await submitRoomSignal(body.roomId ?? "", session.playerId, body.clue ?? { word: "", number: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
