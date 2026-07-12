import "server-only";

import { z } from "zod";

import { AuthApplicationError } from "@/auth/auth-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const claimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email().optional(),
  exp: z.number().int().positive(),
  role: z.string().optional(),
});

export interface AuthClaims {
  userId: string;
  email: string | null;
  expiresAt: number;
  role: string | null;
}

interface ClaimsClient {
  auth: {
    getClaims(): Promise<{
      data: { claims: unknown } | null;
      error: { message: string } | null;
    }>;
  };
}

export async function getAuthClaims(
  client?: ClaimsClient,
): Promise<AuthClaims | null> {
  const supabase = client ?? (await createServerSupabaseClient());
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const result = claimsSchema.safeParse(data.claims);
  if (!result.success) {
    throw new AuthApplicationError(
      "AUTH_INVALID_SESSION",
      "Invalid Supabase JWT claims.",
    );
  }

  return {
    userId: result.data.sub,
    email: result.data.email ?? null,
    expiresAt: result.data.exp,
    role: result.data.role ?? null,
  };
}
