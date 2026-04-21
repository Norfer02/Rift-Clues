import { NextResponse } from "next/server";
import { randomizeRoomTeams, toLobbyError } from "@/lib/server/lobby-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
    };

    const result = await randomizeRoomTeams(body.roomId ?? "", body.playerId ?? "");
    return NextResponse.json(result);
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
