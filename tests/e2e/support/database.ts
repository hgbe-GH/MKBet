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

export function resetSingleRoomScenario(): void {
  const { dbUrl } = getLocalSupabaseEnvironment();
  execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1"], {
    input: [
      "begin;",
      "set local session_replication_role = replica;",
      "delete from public.event_report_votes;",
      "delete from public.event_report_media;",
      "delete from public.event_reports;",
      "delete from public.media_assets where season_id = public.single_room_id();",
      "delete from storage.objects where bucket_id = 'season-media' and name like public.single_room_id()::text || '/%';",
      "delete from public.wallet_transactions where season_id = public.single_room_id() and transaction_type <> 'INITIAL_CREDIT';",
      "delete from public.bet_legs where market_id in (select id from public.markets where season_id = public.single_room_id());",
      "delete from public.bets where season_id = public.single_room_id();",
      "delete from public.bet_quote_legs where quote_id in (select id from public.bet_quotes where season_id = public.single_room_id());",
      "delete from public.bet_quotes where season_id = public.single_room_id();",
      "delete from public.settlements where market_id in (select id from public.markets where season_id = public.single_room_id());",
      "update public.wallets set balance_mkb = 1000, total_staked_mkb = 0, total_returned_mkb = 0, version = version + 1 where season_id = public.single_room_id();",
      "update public.market_outcomes set result_status = 'PENDING' where market_id in (select id from public.markets where season_id = public.single_room_id());",
      "update public.markets set status = 'OPEN', suspension_reason = null where season_id = public.single_room_id();",
      "commit;",
    ].join("\n"),
    stdio: ["pipe", "ignore", "ignore"],
  });
}
