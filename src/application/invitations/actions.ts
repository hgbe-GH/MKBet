"use server";

import { redirect } from "next/navigation";

import { mapAuthErrorToMessage } from "@/application/auth";
import { invitationTokenSchema } from "@/application/auth/validation";
import type { ActionResult, AuthErrorCode } from "@/auth/auth-errors";
import { requireAuthForAction } from "@/auth/require-auth";
import { asRpcClient, firstRpcRow } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InvitationFormState = ActionResult;

function failure(code: AuthErrorCode): InvitationFormState {
  return {
    ok: false,
    code,
    message: mapAuthErrorToMessage(code),
  };
}

export async function acceptInvitationAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  await requireAuthForAction();
  const parsedToken = invitationTokenSchema.safeParse(formData.get("token"));

  if (!parsedToken.success) {
    return failure("INVITATION_INVALID");
  }

  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } = await supabase.rpc<{ season_id: string }[]>(
    "accept_season_invitation",
    { p_token: parsedToken.data },
  );

  const seasonId = firstRpcRow(data)?.season_id;

  if (error || !seasonId) {
    return failure("INVITATION_INVALID");
  }

  redirect(`/dashboard?season=${encodeURIComponent(seasonId)}`);
}
