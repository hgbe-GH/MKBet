"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  mapAuthErrorToMessage,
  sanitizeInternalRedirectPath,
} from "@/application/auth";
import {
  loginFormSchema,
  updateAccountSchema,
} from "@/application/auth/validation";
import type { ActionResult, AuthErrorCode } from "@/auth/auth-errors";
import { requireAuthForAction } from "@/auth/require-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toSupabaseConfigurationError } from "@/lib/supabase/errors";

export type AuthFormState = ActionResult;

const SUCCESS_LOGIN_MESSAGE =
  "Si cette adresse est autorisée, un lien d'accès vient d'être envoyé.";

function failure(code: AuthErrorCode): AuthFormState {
  return {
    ok: false,
    code,
    message: mapAuthErrorToMessage(code),
  };
}

function requestOrigin(headersList: Headers): string | null {
  const origin = headersList.get("origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol === "https:" || parsed.hostname === "localhost") {
        return parsed.origin;
      }
    } catch {
      return null;
    }
  }

  const host = headersList.get("host");
  if (!host) {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : null;
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function requestLoginLink(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return failure("AUTH_EMAIL_SEND_FAILED");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const origin = requestOrigin(await headers()) ?? "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", parsed.data.next);

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: callbackUrl.toString(),
        data: parsed.data.displayName
          ? { display_name: parsed.data.displayName }
          : undefined,
      },
    });

    if (error) {
      return failure("AUTH_EMAIL_SEND_FAILED");
    }

    return {
      ok: true,
      message: SUCCESS_LOGIN_MESSAGE,
    };
  } catch (error) {
    if (toSupabaseConfigurationError(error)) {
      return failure("SUPABASE_NOT_CONFIGURED");
    }
    return failure("AUTH_EMAIL_SEND_FAILED");
  }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateAccount(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const claims = await requireAuthForAction();
  const parsed = updateAccountSchema.safeParse({
    displayName: formData.get("displayName"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return failure("DATABASE_OPERATION_FAILED");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      avatar_url: parsed.data.avatarUrl,
    })
    .eq("id", claims.userId);

  if (error) {
    return failure("DATABASE_OPERATION_FAILED");
  }

  return {
    ok: true,
    message: "Profil mis à jour.",
  };
}

export { sanitizeInternalRedirectPath };
