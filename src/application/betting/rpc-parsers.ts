import { z } from "zod";

const quoteLegSchema = z.object({
  market_id: z.string().uuid(),
  outcome_id: z.string().uuid(),
  event_code: z.string(),
  fair_probability: z.coerce.number().min(0).max(1),
  displayed_odds: z.coerce.number().min(1.05).max(50),
  odds_version: z.coerce.number().int().positive(),
});

export const quotePayloadSchema = z.object({
  ok: z.literal(true),
  quote_id: z.string().uuid(),
  bet_type: z.enum(["SINGLE", "ACCUMULATOR"]),
  stake_mkb: z.coerce.number().int().positive(),
  total_odds: z.coerce.number().min(1.05).max(50),
  potential_return_mkb: z.coerce.number().int().positive(),
  expires_at: z.string().datetime({ offset: true }),
  correlation_adjustment: z.coerce.number().positive().nullable(),
  legs: z.array(quoteLegSchema).min(1).max(3),
});

export const placedBetPayloadSchema = z.object({
  ok: z.literal(true),
  bet_id: z.string().uuid(),
  ticket_number: z.string().min(1).max(16),
  balance_mkb: z.coerce.number().int().nonnegative(),
  stake_mkb: z.coerce.number().int().positive(),
  total_odds: z.coerce.number().min(1.05).max(50),
  potential_return_mkb: z.coerce.number().int().positive(),
});

export const rpcFailureSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
  current_legs: z.unknown().optional(),
});
