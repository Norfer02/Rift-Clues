import { NextResponse } from "next/server";
import { returnRoomToLobby, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
    };

    await returnRoomToLobby(body.roomId ?? "", body.playerId ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
