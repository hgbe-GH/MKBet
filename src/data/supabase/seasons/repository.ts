import "server-only";

import type {
  DashboardSeason,
  SeasonSummary,
} from "@/application/seasons/types";
import { asRpcClient, firstRpcRow } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listCurrentUserSeasons(): Promise<SeasonSummary[]> {
  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } =
    await supabase.rpc<SeasonSummary[]>("list_my_seasons");

  if (error) {
    throw new Error("DATABASE_OPERATION_FAILED");
  }

  return data ?? [];
}

export async function getCurrentUserDashboardSeason(
  seasonId: string | null,
): Promise<DashboardSeason | null> {
  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } = await supabase.rpc<DashboardSeason[]>(
    "get_dashboard_season",
    { p_season_id: seasonId },
  );

  if (error) {
    throw new Error("SEASON_ACCESS_DENIED");
  }

  return firstRpcRow(data);
}
