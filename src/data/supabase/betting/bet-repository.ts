import "server-only";

import type { BetStatus } from "@/domain/database/enums";
import { getAuthClaims } from "@/auth/get-auth-claims";
import type { SportsbookBet } from "@/fixtures/sportsbook/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listCurrentUserBets(
  seasonId: string,
  status?: BetStatus,
): Promise<SportsbookBet[]> {
  const supabase = await createServerSupabaseClient();
  const claims = await getAuthClaims();
  if (!claims) throw new Error("AUTH_REQUIRED");
  let query = supabase
    .from("bets")
    .select("*")
    .eq("season_id", seasonId)
    .eq("user_id", claims.userId)
    .order("placed_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: bets, error } = await query;
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  if (!bets?.length) return [];

  const { data: legs, error: legsError } = await supabase
    .from("bet_legs")
    .select("*")
    .in(
      "bet_id",
      bets.map((bet) => bet.id),
    );
  if (legsError) throw new Error("DATABASE_OPERATION_FAILED");
  const marketIds = [...new Set((legs ?? []).map((leg) => leg.market_id))];
  const outcomeIds = [...new Set((legs ?? []).map((leg) => leg.outcome_id))];
  const [{ data: markets }, { data: outcomes }] = await Promise.all([
    marketIds.length
      ? supabase.from("markets").select("id,title").in("id", marketIds)
      : Promise.resolve({ data: [] }),
    outcomeIds.length
      ? supabase
          .from("market_outcomes")
          .select("id,label,displayed_odds")
          .in("id", outcomeIds)
      : Promise.resolve({ data: [] }),
  ]);
  const marketMap = new Map(
    (markets ?? []).map((market) => [market.id, market]),
  );
  const outcomeMap = new Map(
    (outcomes ?? []).map((outcome) => [outcome.id, outcome]),
  );

  return bets.map((bet) => ({
    id: bet.id,
    placedAt: bet.placed_at,
    type: bet.bet_type,
    stakeMkb: bet.stake_mkb,
    totalOdds: bet.total_odds,
    potentialReturnMkb: bet.potential_return_mkb,
    status:
      bet.status === "PENDING" || bet.status === "PARTIALLY_SETTLED"
        ? "OPEN"
        : bet.status,
    legs: (legs ?? [])
      .filter((leg) => leg.bet_id === bet.id)
      .map((leg) => ({
        marketTitle: marketMap.get(leg.market_id)?.title ?? "Marché",
        outcomeLabel: outcomeMap.get(leg.outcome_id)?.label ?? "Issue",
        oddsAtBet: leg.odds_at_bet,
        currentOdds:
          outcomeMap.get(leg.outcome_id)?.displayed_odds ?? leg.odds_at_bet,
        status: leg.status,
      })),
  }));
}
