import { NextResponse } from "next/server";
import { startRoomGame, toLobbyError } from "@/lib/server/lobby-service";
import type { WordPoolLocale } from "@/data/lol-terms";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
      locale?: WordPoolLocale;
    };

    await startRoomGame(body.roomId ?? "", body.playerId ?? "", body.locale ?? "en");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
