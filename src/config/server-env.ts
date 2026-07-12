import "server-only";

import { z } from "zod";

import {
  formatConfigurationError,
  getPublicSupabaseEnv,
  type PublicSupabaseEnv,
} from "@/config/env";

const serverSecretSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export interface ServerSupabaseEnv extends PublicSupabaseEnv {
  serviceRoleKey: string;
}

export function getServerSupabaseEnv(): ServerSupabaseEnv {
  const publicEnv = getPublicSupabaseEnv();
  const result = serverSecretSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    throw formatConfigurationError("Supabase server configuration error", [
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  }

  return {
    ...publicEnv,
    serviceRoleKey: result.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}
