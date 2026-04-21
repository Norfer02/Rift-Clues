import "server-only";

import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { toLobbyError } from "@/lib/server/lobby-service";

type VerifyRequestedRoomContextParams = {
  roomId?: string;
  roomCode?: string;
  sessionRoomCode: string;
};

export async function verifyRequestedRoomContext({
  roomId,
  roomCode,
  sessionRoomCode,
}: VerifyRequestedRoomContextParams) {
  if (roomCode && roomCode.toUpperCase() !== sessionRoomCode) {
    throw new Error(
      "Room mismatch: requested room does not match the signed lobby session.",
    );
  }

  if (!roomId) {
    return;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("rooms")
    .select("code")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    throw toLobbyError(error);
  }

  if (!data) {
    throw new Error("Room not found.");
  }

  if (data.code !== sessionRoomCode) {
    throw new Error(
      "Room mismatch: requested room does not match the signed lobby session.",
    );
  }
}
