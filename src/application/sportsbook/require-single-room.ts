import "server-only";

import { requireAuth } from "@/auth/require-auth";
import { ensureSingleRoomAccess } from "@/data/supabase/events/repository";
import { getCurrentSportsbookSeason } from "@/data/supabase/sportsbook/repository";

export async function requireSingleRoom() {
  await requireAuth("/direct");
  const roomId = await ensureSingleRoomAccess();
  const room = await getCurrentSportsbookSeason(roomId);
  if (!room) throw new Error("SINGLE_ROOM_UNAVAILABLE");
  return room;
}
