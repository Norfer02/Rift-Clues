import { NextResponse } from "next/server";
import { leaveRoom, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
    };

    await leaveRoom(body.roomId ?? "", body.playerId ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
