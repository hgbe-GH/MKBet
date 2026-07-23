import "server-only";

import type { LeaderboardRow } from "@/fixtures/sportsbook/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listSeasonLeaderboard(
  seasonId: string,
): Promise<LeaderboardRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_season_leaderboard", {
    p_season_id: seasonId,
  });
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    rank: row.rank,
    playerName: row.display_name,
    avatarUrl: row.avatar_url,
    capitalMkb: row.balance_mkb,
    totalStakedMkb: row.total_staked_mkb,
    totalReturnedMkb: row.total_returned_mkb,
    netProfitMkb: row.net_profit_mkb,
  }));
}
