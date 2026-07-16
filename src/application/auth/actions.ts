"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { mapAuthErrorToMessage } from "@/application/auth";
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInFormSchema,
  signUpFormSchema,
  updateAccountSchema,
} from "@/application/auth/validation";
import { initializeAuthenticatedAccess } from "@/application/auth/initialize-access";
import type { ActionResult, AuthErrorCode } from "@/auth/auth-errors";
import { requireAuthForAction } from "@/auth/require-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toSupabaseConfigurationError } from "@/lib/supabase/errors";

export type AuthFormState = ActionResult;

const SIGN_UP_SUCCESS =
  "Compte créé. Confirme ton adresse depuis l'e-mail reçu avant de te connecter.";
const RESET_REQUEST_SUCCESS =
  "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.";
const PASSWORD_UPDATE_SUCCESS =
  "Mot de passe modifié. Tu peux maintenant te connecter.";

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
      if (
        parsed.protocol === "https:" ||
        (parsed.protocol === "http:" && parsed.hostname === "localhost")
      ) {
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

export async function signInWithPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return failure("AUTH_INVALID_CREDENTIALS");
  }

  const next = parsed.data.next;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return failure("AUTH_INVALID_CREDENTIALS");
    }

    const initialization = await initializeAuthenticatedAccess(supabase);
    if (!initialization.ok) {
      try {
        await supabase.auth.signOut();
      } catch {
        // The generic initialization failure remains the public result.
      }
      return failure("DATABASE_OPERATION_FAILED");
    }
  } catch (error) {
    if (toSupabaseConfigurationError(error)) {
      return failure("SUPABASE_NOT_CONFIGURED");
    }
    return failure("AUTH_INVALID_CREDENTIALS");
  }

  redirect(next);
}

export async function signUpWithPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpFormSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return failure("AUTH_SIGN_UP_FAILED");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const origin = requestOrigin(await headers()) ?? "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("intent", "signup");
    callbackUrl.searchParams.set("next", parsed.data.next);

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return failure("AUTH_SIGN_UP_FAILED");
    }

    return { ok: true, message: SIGN_UP_SUCCESS };
  } catch (error) {
    if (toSupabaseConfigurationError(error)) {
      return failure("SUPABASE_NOT_CONFIGURED");
    }
    return failure("AUTH_SIGN_UP_FAILED");
  }
}

/** @deprecated Removed with LoginForm in Task 3. */
export const requestLoginLink = signUpWithPasswordAction;

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return failure("AUTH_PASSWORD_RESET_FAILED");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const origin = requestOrigin(await headers()) ?? "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("intent", "recovery");

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: callbackUrl.toString(),
    });
  } catch (error) {
    if (toSupabaseConfigurationError(error)) {
      return failure("SUPABASE_NOT_CONFIGURED");
    }
  }

  return { ok: true, message: RESET_REQUEST_SUCCESS };
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return failure("AUTH_PASSWORD_UPDATE_FAILED");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return failure("AUTH_INVALID_SESSION");
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) {
      return failure("AUTH_PASSWORD_UPDATE_FAILED");
    }

    return { ok: true, message: PASSWORD_UPDATE_SUCCESS };
  } catch (error) {
    if (toSupabaseConfigurationError(error)) {
      return failure("SUPABASE_NOT_CONFIGURED");
    }
    return failure("AUTH_PASSWORD_UPDATE_FAILED");
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
