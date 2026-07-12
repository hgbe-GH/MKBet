import "server-only";

import type { ParsedMarketSearchParams } from "@/application/sportsbook/market-query";
import { mapMarketRow } from "@/data/supabase/markets/market-mappers";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listSeasonMarkets(
  seasonId: string,
  filters: ParsedMarketSearchParams,
  limit = 50,
): Promise<SportsbookMarket[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("markets")
    .select("*")
    .eq("season_id", seasonId)
    .order("closes_at", { ascending: true })
    .limit(limit);
  if (filters.category !== "ALL")
    query = query.eq("category", filters.category);
  if (filters.status !== "ALL") query = query.eq("status", filters.status);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);

  const { data: markets, error } = await query;
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  if (!markets?.length) return [];

  const marketIds = markets.map((market) => market.id);
  const [
    { data: outcomes, error: outcomesError },
    { data: snapshots, error: snapshotsError },
  ] = await Promise.all([
    supabase.from("market_outcomes").select("*").in("market_id", marketIds),
    supabase
      .from("odds_snapshots")
      .select("*")
      .in("market_id", marketIds)
      .order("calculated_at", { ascending: true }),
  ]);
  if (outcomesError || snapshotsError)
    throw new Error("DATABASE_OPERATION_FAILED");

  const mapped = markets.map((market) =>
    mapMarketRow(market, outcomes ?? [], snapshots ?? []),
  );
  if (filters.sort === "odds") {
    return mapped.toSorted(
      (left, right) =>
        (left.outcomes[0]?.odds ?? 50) - (right.outcomes[0]?.odds ?? 50),
    );
  }
  if (filters.sort === "movement") {
    return mapped.toSorted(
      (left, right) => right.oddsVersion - left.oddsVersion,
    );
  }
  return mapped;
}

export async function getSeasonMarket(
  seasonId: string,
  marketId: string,
): Promise<SportsbookMarket | null> {
  const supabase = await createServerSupabaseClient();
  const { data: market, error } = await supabase
    .from("markets")
    .select("*")
    .eq("season_id", seasonId)
    .eq("id", marketId)
    .maybeSingle();
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  if (!market) return null;
  const [{ data: outcomes }, { data: snapshots }] = await Promise.all([
    supabase.from("market_outcomes").select("*").eq("market_id", market.id),
    supabase
      .from("odds_snapshots")
      .select("*")
      .eq("market_id", market.id)
      .order("calculated_at", { ascending: true }),
  ]);
  return mapMarketRow(market, outcomes ?? [], snapshots ?? []);
}
