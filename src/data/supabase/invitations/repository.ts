import "server-only";

import type { InvitationPreview } from "@/application/invitations/types";
import { invitationTokenSchema } from "@/application/auth/validation";
import { asRpcClient, firstRpcRow } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getInvitationPreview(
  token: string,
): Promise<InvitationPreview> {
  const parsedToken = invitationTokenSchema.safeParse(token);

  if (!parsedToken.success) {
    return {
      isValid: false,
      seasonTitle: null,
      proposedRole: null,
      proposedSubjectKey: null,
      expiresAt: null,
      maskedEmail: null,
      reason: "INVITATION_INVALID",
    };
  }

  const supabase = asRpcClient(await createServerSupabaseClient());
  const { data, error } = await supabase.rpc<InvitationPreview[]>(
    "get_invitation_preview",
    { p_token: parsedToken.data },
  );

  const preview = firstRpcRow(data);

  if (error || !preview) {
    return {
      isValid: false,
      seasonTitle: null,
      proposedRole: null,
      proposedSubjectKey: null,
      expiresAt: null,
      maskedEmail: null,
      reason: "INVITATION_INVALID",
    };
  }

  return preview;
}
