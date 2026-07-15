import { NextResponse, type NextRequest } from "next/server";

import { sanitizeInternalRedirectPath } from "@/application/auth";
import { asRpcClient } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthCallbackFailureStage =
  "exchange" | "missing_code" | "profile" | "room";

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
  const next = sanitizeInternalRedirectPath(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    return redirectToAuthError(request, "missing_code");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToAuthError(request, "exchange");
  }

  const { error: profileError } = await asRpcClient(supabase).rpc(
    "ensure_current_profile",
  );
  if (profileError) {
    return redirectToAuthError(request, "profile");
  }

  const { error: roomError } = await asRpcClient(supabase).rpc(
    "ensure_single_room_access",
  );
  if (roomError) {
    return redirectToAuthError(request, "room");
  }

  return NextResponse.redirect(new URL(next || "/direct", request.url));
}
