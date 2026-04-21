import { NextResponse } from "next/server";
import { toLobbyError, updatePlayerSelection } from "@/lib/server/lobby-service";
import { requireLobbySession } from "@/lib/server/lobby-session";
import { verifyRequestedRoomContext } from "@/lib/server/verify-room-session";
import type { LobbyPlayer } from "@/types/lobby";

export async function POST(request: Request) {
  try {
    const session = await requireLobbySession();
    const body = (await request.json()) as {
      roomId?: string;
      roomCode?: string;
      playerId?: string;
      patch?: Partial<
        Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
      >;
    };

    await verifyRequestedRoomContext({
      roomId: body.roomId,
      roomCode: body.roomCode,
      sessionRoomCode: session.roomCode,
    });
    await updatePlayerSelection(body.roomId ?? "", session.playerId, body.patch ?? {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
