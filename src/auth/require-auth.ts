import "server-only";

import { redirect } from "next/navigation";

import { sanitizeInternalRedirectPath } from "@/application/auth";
import { AuthApplicationError } from "@/auth/auth-errors";
import { getAuthClaims, type AuthClaims } from "@/auth/get-auth-claims";

export async function requireAuth(nextPath = "/seasons"): Promise<AuthClaims> {
  const claims = await getAuthClaims();

  if (!claims) {
    const next = encodeURIComponent(sanitizeInternalRedirectPath(nextPath));
    redirect(`/login?next=${next}`);
  }

  return claims;
}

export async function requireAuthForAction(): Promise<AuthClaims> {
  const claims = await getAuthClaims();

  if (!claims) {
    throw new AuthApplicationError("AUTH_REQUIRED", "Authentication required.");
  }

  return claims;
}
