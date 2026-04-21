import { NextResponse } from "next/server";
import { revealRoomCard, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
      cardId?: string;
    };

    await revealRoomCard(body.roomId ?? "", body.playerId ?? "", body.cardId ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
