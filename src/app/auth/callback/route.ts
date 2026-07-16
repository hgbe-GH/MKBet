import { NextResponse, type NextRequest } from "next/server";

import { sanitizeInternalRedirectPath } from "@/application/auth";
import {
  hasRecoveryAuthenticationMethod,
  hasValidAuthenticationMethods,
} from "@/application/auth/recovery-claims";
import { initializeAuthenticatedAccess } from "@/application/auth/initialize-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthCallbackFailureStage =
  "claims" | "exchange" | "missing_code" | "profile" | "recovery" | "room";

function redirectToAuthError(
  request: NextRequest,
  stage: AuthCallbackFailureStage,
) {
  console.error("[auth.callback] failed", { stage });
  const errorUrl = new URL("/auth/error", request.url);
  errorUrl.searchParams.set("reason", stage);
  return NextResponse.redirect(errorUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const intent = requestUrl.searchParams.get("intent");
  const next = sanitizeInternalRedirectPath(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    return redirectToAuthError(request, "missing_code");
  }

  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  try {
    supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToAuthError(request, "exchange");
    }
  } catch {
    return redirectToAuthError(request, "exchange");
  }

  let claims: unknown;
  try {
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    claims = claimsData?.claims;

    if (claimsError || !hasValidAuthenticationMethods(claims)) {
      return redirectToAuthError(request, "claims");
    }
  } catch {
    return redirectToAuthError(request, "claims");
  }

  if (hasRecoveryAuthenticationMethod(claims)) {
    return NextResponse.redirect(new URL("/auth/update-password", request.url));
  }

  if (intent === "recovery") {
    return redirectToAuthError(request, "recovery");
  }

  let initialization: Awaited<ReturnType<typeof initializeAuthenticatedAccess>>;
  try {
    initialization = await initializeAuthenticatedAccess(supabase);
  } catch {
    return redirectToAuthError(request, "profile");
  }

  if (!initialization.ok) {
    return redirectToAuthError(request, initialization.stage);
  }

  return NextResponse.redirect(new URL(next || "/direct", request.url));
}
