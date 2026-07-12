"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/config/env";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const env = getPublicSupabaseEnv();
  return createBrowserClient<Database>(env.url, env.publishableKey);
}
