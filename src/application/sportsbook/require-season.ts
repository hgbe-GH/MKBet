import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSportsbookSeason } from "@/data/supabase/sportsbook/repository";

export async function requireSportsbookSeason(seasonId: string | null = null) {
  const season = await getCurrentSportsbookSeason(seasonId);
  if (!season) redirect("/seasons");
  return season;
}
