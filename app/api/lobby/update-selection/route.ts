import { NextResponse } from "next/server";
import { toLobbyError, updatePlayerSelection } from "@/lib/server/lobby-service";
import type { LobbyPlayer } from "@/types/lobby";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      playerId?: string;
      patch?: Partial<
        Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
      >;
    };

    await updatePlayerSelection(body.roomId ?? "", body.playerId ?? "", body.patch ?? {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalizedError = toLobbyError(error);
    return NextResponse.json({ error: normalizedError.message }, { status: 400 });
  }
}
