import "server-only";

import { asRpcClient, firstRpcRow } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function listActiveBinaryTemplates(): Promise<
  Tables<"market_templates">[]
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("market_templates")
    .select("*")
    .eq("market_type", "BINARY")
    .eq("is_active", true)
    .order("code");
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return data ?? [];
}

export interface DefaultMarketSchedule {
  physical_deadline_at: string;
  relationship_deadline_at: string;
  closes_at: string;
}

export async function getDefaultMarketSchedule(
  seasonId: string,
): Promise<DefaultMarketSchedule> {
  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } = await supabase.rpc<DefaultMarketSchedule[]>(
    "get_default_market_schedule",
    { p_season_id: seasonId },
  );
  const schedule = firstRpcRow(data);
  if (error || !schedule) throw new Error("DATABASE_OPERATION_FAILED");
  return schedule;
}
