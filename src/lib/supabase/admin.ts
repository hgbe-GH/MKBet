import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/config/server-env";
import type { Database } from "@/types/database";

export function createAdminSupabaseClient() {
  const env = getServerSupabaseEnv();

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
