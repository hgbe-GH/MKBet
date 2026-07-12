"use server";

import { revalidatePath } from "next/cache";

import {
  extractBettingErrorCode,
  isBettingErrorCode,
  mapBettingErrorToMessage,
} from "@/application/betting/betting-errors";
import {
  placeBetSchema,
  type PlaceBetInput,
} from "@/application/betting/betting-schemas";
import {
  placedBetPayloadSchema,
  rpcFailureSchema,
} from "@/application/betting/rpc-parsers";
import type { PlaceBetActionResult } from "@/application/betting/types";
import { requireAuthForAction } from "@/auth/require-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function placeBetAction(
  input: PlaceBetInput,
): Promise<PlaceBetActionResult> {
  await requireAuthForAction();
  const parsed = placeBetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
      message: mapBettingErrorToMessage("DATABASE_OPERATION_FAILED"),
    };
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("place_bet", {
    p_quote_id: parsed.data.quoteId,
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
      details:
        failure.data.current_legs === undefined
          ? undefined
          : { currentLegs: failure.data.current_legs },
    };
  }
  const bet = placedBetPayloadSchema.safeParse(data);
  if (!bet.success) {
    return {
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
      message: mapBettingErrorToMessage("DATABASE_OPERATION_FAILED"),
    };
  }
  for (const path of ["/dashboard", "/bets", "/wallet", "/leaderboard"]) {
    revalidatePath(path);
  }
  return {
    ok: true,
    bet: {
      betId: bet.data.bet_id,
      ticketNumber: bet.data.ticket_number,
      balanceMkb: bet.data.balance_mkb,
      stakeMkb: bet.data.stake_mkb,
      totalOdds: bet.data.total_odds,
      potentialReturnMkb: bet.data.potential_return_mkb,
    },
  };
}
