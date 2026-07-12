"use server";

import {
  mapBettingErrorToMessage,
  extractBettingErrorCode,
  isBettingErrorCode,
} from "@/application/betting/betting-errors";
import {
  createBetQuoteSchema,
  type CreateBetQuoteInput,
} from "@/application/betting/betting-schemas";
import {
  quotePayloadSchema,
  rpcFailureSchema,
} from "@/application/betting/rpc-parsers";
import type { BetQuoteActionResult } from "@/application/betting/types";
import { requireAuthForAction } from "@/auth/require-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createBetQuoteAction(
  input: CreateBetQuoteInput,
): Promise<BetQuoteActionResult> {
  await requireAuthForAction();
  const parsed = createBetQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues.some(
      (issue) => issue.path[0] === "outcomeIds",
    )
      ? "INVALID_SELECTION_COUNT"
      : "INVALID_STAKE";
    return { ok: false, code, message: mapBettingErrorToMessage(code) };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_bet_quote", {
    p_season_id: parsed.data.seasonId,
    p_stake_mkb: parsed.data.stakeMkb,
    p_outcome_ids: parsed.data.outcomeIds,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const code = extractBettingErrorCode(error);
    return { ok: false, code, message: mapBettingErrorToMessage(code) };
  }
  const failure = rpcFailureSchema.safeParse(data);
  if (failure.success && isBettingErrorCode(failure.data.code)) {
    return {
      ok: false,
      code: failure.data.code,
      message: mapBettingErrorToMessage(failure.data.code),
    };
  }
  const quote = quotePayloadSchema.safeParse(data);
  if (!quote.success) {
    return {
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
      message: mapBettingErrorToMessage("DATABASE_OPERATION_FAILED"),
    };
  }
  return {
    ok: true,
    quote: {
      quoteId: quote.data.quote_id,
      betType: quote.data.bet_type,
      stakeMkb: quote.data.stake_mkb,
      totalOdds: quote.data.total_odds,
      potentialReturnMkb: quote.data.potential_return_mkb,
      expiresAt: quote.data.expires_at,
      correlationAdjustment: quote.data.correlation_adjustment,
      legs: quote.data.legs.map((leg) => ({
        marketId: leg.market_id,
        outcomeId: leg.outcome_id,
        eventCode: leg.event_code,
        fairProbability: leg.fair_probability,
        displayedOdds: leg.displayed_odds,
        oddsVersion: leg.odds_version,
      })),
    },
  };
}
