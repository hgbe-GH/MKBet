import {
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/application/auth/actions";
import { sanitizeInternalRedirectPath } from "@/application/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { InlineNotice } from "@/components/ui/inline-notice";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export function parseAuthMode(value: unknown): "login" | "register" {
  return value === "register" ? "register" : "login";
}

export function hasPasswordUpdatedNotice(value: unknown): boolean {
  return value === "password-updated";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeInternalRedirectPath(params?.next);
  const mode = parseAuthMode(params?.mode);
  const showPasswordUpdatedNotice = hasPasswordUpdatedNotice(params?.notice);

  return (
    <AuthShell mode={mode} next={next}>
      {mode === "register" ? (
        <SignUpForm action={signUpWithPasswordAction} next={next} />
      ) : (
        <div className="space-y-5">
          {showPasswordUpdatedNotice ? (
            <InlineNotice className="space-y-1" tone="success">
              <h2 className="text-lg font-black text-white">
                Mot de passe modifié
              </h2>
              <p>Tu peux maintenant te connecter.</p>
            </InlineNotice>
          ) : null}
          <SignInForm action={signInWithPasswordAction} next={next} />
        </div>
      )}
    </AuthShell>
  );
}
