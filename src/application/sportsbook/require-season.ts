import "server-only";

import { requireSingleRoom } from "@/application/sportsbook/require-single-room";

export async function requireSportsbookSeason() {
  return requireSingleRoom();
}
