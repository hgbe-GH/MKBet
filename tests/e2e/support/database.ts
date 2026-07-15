import { execFileSync } from "node:child_process";

import { z } from "zod";

import { getLocalSupabaseEnvironment } from "./local-supabase";

export function moveOutcomeOdds(marketId: string, outcomeId: string): void {
  const parsed = z
    .object({ marketId: z.string().uuid(), outcomeId: z.string().uuid() })
    .parse({ marketId, outcomeId });
  const { dbUrl } = getLocalSupabaseEnvironment();
  execFileSync(
    "psql",
    [
      dbUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `market_id=${parsed.marketId}`,
      "-v",
      `outcome_id=${parsed.outcomeId}`,
    ],
    {
      input: [
        "update public.market_outcomes",
        "set displayed_odds = displayed_odds + 0.01",
        "where id = :'outcome_id'::uuid;",
        "update public.markets",
        "set odds_version = odds_version + 1",
        "where id = :'market_id'::uuid;",
      ].join("\n"),
      stdio: ["pipe", "ignore", "ignore"],
    },
  );
}
