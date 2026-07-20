import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/application/auth/actions";
import { hasRecoveryAuthenticationMethod } from "@/application/auth/recovery-claims";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  let hasRecoverySession = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    hasRecoverySession =
      !error && hasRecoveryAuthenticationMethod(data?.claims);
  } catch {
    hasRecoverySession = false;
  }

  if (!hasRecoverySession) {
    redirect("/login");
  }

  return (
    <AuthShell showModeNavigation={false}>
      <UpdatePasswordForm action={updatePasswordAction} />
    </AuthShell>
  );
}
