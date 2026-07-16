import type { SupabaseClient } from "@supabase/supabase-js";

import { asRpcClient } from "@/data/supabase/rpc";
import type { Database } from "@/types/database";

export type AccessInitializationResult =
  { ok: true } | { ok: false; stage: "profile" | "room" };

export async function initializeAuthenticatedAccess(
  client: SupabaseClient<Database>,
): Promise<AccessInitializationResult> {
  const rpc = asRpcClient(client);

  try {
    const { error } = await rpc.rpc("ensure_current_profile");
    if (error) {
      return { ok: false, stage: "profile" };
    }
  } catch {
    return { ok: false, stage: "profile" };
  }

  try {
    const { error } = await rpc.rpc("ensure_single_room_access");
    if (error) {
      return { ok: false, stage: "room" };
    }
  } catch {
    return { ok: false, stage: "room" };
  }

  return { ok: true };
}
