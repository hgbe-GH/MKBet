"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { mapAuthErrorToMessage } from "@/application/auth";
import { seasonFormSchema } from "@/application/auth/validation";
import type { ActionResult, AuthErrorCode } from "@/auth/auth-errors";
import { requireAuthForAction } from "@/auth/require-auth";
import { asRpcClient, firstRpcRow } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SeasonFormState = ActionResult;

const initialFailure = (code: AuthErrorCode): SeasonFormState => ({
  ok: false,
  code,
  message: mapAuthErrorToMessage(code),
});

export async function createSeasonAction(
  _previousState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  await requireAuthForAction();

  const parsed = seasonFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    breakupDate: formData.get("breakupDate"),
    startedAt: formData.get("startedAt"),
    startingBalanceMkb: formData.get("startingBalanceMkb"),
    secretBetsUntilClose: formData.get("secretBetsUntilClose"),
    idempotencyKey: formData.get("idempotencyKey") || randomUUID(),
  });

  if (!parsed.success) {
    return initialFailure("DATABASE_OPERATION_FAILED");
  }

  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } = await supabase.rpc<{ season_id: string }[]>(
    "create_season",
    {
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_breakup_date: parsed.data.breakupDate,
      p_started_at: parsed.data.startedAt,
      p_starting_balance_mkb: parsed.data.startingBalanceMkb,
      p_secret_bets_until_close: parsed.data.secretBetsUntilClose,
      p_idempotency_key: parsed.data.idempotencyKey,
    },
  );

  const seasonId = firstRpcRow(data)?.season_id;

  if (error || !seasonId) {
    return initialFailure("DATABASE_OPERATION_FAILED");
  }

  redirect(`/dashboard?season=${encodeURIComponent(seasonId)}`);
}
