import "server-only";

import type { Tables } from "@/types/database";
import { getAuthClaims } from "@/auth/get-auth-claims";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface WalletHistory {
  wallet: Tables<"wallets">;
  transactions: Tables<"wallet_transactions">[];
  startingBalanceMkb: number;
}

export async function getCurrentUserWallet(
  seasonId: string,
): Promise<WalletHistory | null> {
  const supabase = await createServerSupabaseClient();
  const claims = await getAuthClaims();
  if (!claims) throw new Error("AUTH_REQUIRED");
  const [{ data: wallet, error }, { data: transactions }, { data: season }] =
    await Promise.all([
      supabase
        .from("wallets")
        .select("*")
        .eq("season_id", seasonId)
        .eq("user_id", claims.userId)
        .maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("season_id", seasonId)
        .eq("user_id", claims.userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("seasons")
        .select("starting_balance_mkb")
        .eq("id", seasonId)
        .maybeSingle(),
    ]);
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  if (!wallet) return null;
  return {
    wallet,
    transactions: transactions ?? [],
    startingBalanceMkb: season?.starting_balance_mkb ?? 0,
  };
}
