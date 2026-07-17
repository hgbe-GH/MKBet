import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../src/types/database";
import { e2eCreatedUsersPath } from "./auth-state";
import { getLocalSupabaseEnvironment } from "./local-supabase";

const registrySchema = z.object({
  userIds: z.array(z.string().uuid()),
});
const passwordAuthEmailSchema = z
  .string()
  .email()
  .regex(
    /^auth-chromium-(?:desktop|mobile)-\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@example\.test$/,
  );

function createLocalAdminClient() {
  const environment = getLocalSupabaseEnvironment();
  return createClient<Database>(environment.url, environment.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function parseCreatedUserRegistry(value: unknown): string[] {
  return registrySchema.parse(value).userIds;
}

export function parsePasswordAuthTestEmail(value: unknown): string {
  return passwordAuthEmailSchema.parse(value);
}

export async function writeCreatedUserRegistry(
  userIds: readonly string[],
): Promise<void> {
  const registry = registrySchema.parse({ userIds });
  await mkdir(path.dirname(e2eCreatedUsersPath), { recursive: true });
  await writeFile(e2eCreatedUsersPath, JSON.stringify(registry), "utf8");
}

export async function readCreatedUserRegistry(): Promise<string[]> {
  try {
    return parseCreatedUserRegistry(
      JSON.parse(await readFile(e2eCreatedUsersPath, "utf8")) as unknown,
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function removeCreatedUserRegistry(): Promise<void> {
  await rm(e2eCreatedUsersPath, { force: true });
}

export async function deleteLocalUserIds(
  userIds: readonly string[],
): Promise<void> {
  const parsedIds = z.array(z.string().uuid()).parse(userIds);
  if (parsedIds.length === 0) return;
  removeLocalE2EBusinessData(parsedIds);
  const admin = createLocalAdminClient();
  for (const userId of parsedIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Unable to delete an E2E identity.");
  }
}

function removeLocalE2EBusinessData(userIds: readonly string[]): void {
  const { dbUrl } = getLocalSupabaseEnvironment();
  execFileSync(
    "psql",
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-v", `user_ids=${userIds.join(",")}`],
    {
      input: [
        "begin;",
        "set local session_replication_role = replica;",
        "create temp table e2e_user_ids (id uuid primary key) on commit drop;",
        "insert into e2e_user_ids select unnest(string_to_array(:'user_ids', ',')::uuid[]);",
        "create temp table e2e_report_ids (id uuid primary key) on commit drop;",
        "insert into e2e_report_ids select id from public.event_reports where author_user_id in (select id from e2e_user_ids);",
        "delete from public.event_report_votes where user_id in (select id from e2e_user_ids) or report_id in (select id from e2e_report_ids);",
        "delete from public.event_report_media where report_id in (select id from e2e_report_ids);",
        "delete from public.event_reports where id in (select id from e2e_report_ids);",
        "delete from public.media_assets where uploaded_by in (select id from e2e_user_ids);",
        "create temp table e2e_market_ids (id uuid primary key) on commit drop;",
        "insert into e2e_market_ids select id from public.markets where created_by in (select id from e2e_user_ids);",
        "create temp table e2e_bet_ids (id uuid primary key) on commit drop;",
        "insert into e2e_bet_ids select distinct bet.id from public.bets bet left join public.bet_legs leg on leg.bet_id = bet.id where bet.user_id in (select id from e2e_user_ids) or leg.market_id in (select id from e2e_market_ids);",
        "create temp table e2e_quote_ids (id uuid primary key) on commit drop;",
        "insert into e2e_quote_ids select distinct quote.id from public.bet_quotes quote left join public.bet_quote_legs leg on leg.quote_id = quote.id where quote.user_id in (select id from e2e_user_ids) or leg.market_id in (select id from e2e_market_ids);",
        "delete from public.wallet_transactions where user_id in (select id from e2e_user_ids) or bet_id in (select id from e2e_bet_ids);",
        "delete from public.bet_legs where bet_id in (select id from e2e_bet_ids);",
        "delete from public.bets where id in (select id from e2e_bet_ids);",
        "delete from public.bet_quote_legs where quote_id in (select id from e2e_quote_ids);",
        "delete from public.bet_quotes where id in (select id from e2e_quote_ids);",
        "delete from private.market_creation_requests where market_id in (select id from e2e_market_ids);",
        "delete from public.settlements where market_id in (select id from e2e_market_ids);",
        "delete from public.odds_snapshots where market_id in (select id from e2e_market_ids);",
        "delete from public.market_outcomes where market_id in (select id from e2e_market_ids);",
        "delete from public.markets where id in (select id from e2e_market_ids);",
        "delete from public.notifications where user_id in (select id from e2e_user_ids);",
        "delete from public.audit_logs where actor_user_id in (select id from e2e_user_ids);",
        "delete from public.season_members where user_id in (select id from e2e_user_ids);",
        "delete from public.wallets where user_id in (select id from e2e_user_ids);",
        "commit;",
      ].join("\n"),
      stdio: ["pipe", "ignore", "ignore"],
    },
  );
}

export async function findLocalPasswordAuthTestUserId(
  email: string,
): Promise<string | null> {
  const safeEmail = parsePasswordAuthTestEmail(email);
  const admin = createLocalAdminClient();
  const perPage = 100;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Unable to inspect E2E identities.");
    const user = data.users.find((candidate) => candidate.email === safeEmail);
    if (user) return user.id;
    if (data.users.length < perPage) return null;
  }
}

export async function deleteLocalPasswordAuthTestUser(
  email: string,
): Promise<boolean> {
  const userId = await findLocalPasswordAuthTestUserId(email);
  if (!userId) return false;
  await deleteLocalUserIds([userId]);
  return true;
}
