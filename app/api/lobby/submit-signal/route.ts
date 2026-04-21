import { NextResponse } from "next/server";
import { submitRoomSignal, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
      clue?: {
        word: string;
        number: number;
      };
    };

    await submitRoomSignal(
      body.roomId ?? "",
      body.playerId ?? "",
      body.clue ?? { word: "", number: 0 },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
