import "server-only";

import type { Tables } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listRecentMarketAudit(
  seasonId: string,
  limit = 10,
): Promise<Tables<"audit_logs">[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("season_id", seasonId)
    .eq("entity_type", "market")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return data ?? [];
}
