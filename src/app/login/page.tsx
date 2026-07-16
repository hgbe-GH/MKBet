import {
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/application/auth/actions";
import { sanitizeInternalRedirectPath } from "@/application/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export function parseAuthMode(value: unknown): "login" | "register" {
  return value === "register" ? "register" : "login";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeInternalRedirectPath(params?.next);
  const mode = parseAuthMode(params?.mode);

  return (
    <AuthShell mode={mode} next={next}>
      {mode === "register" ? (
        <SignUpForm action={signUpWithPasswordAction} next={next} />
      ) : (
        <SignInForm action={signInWithPasswordAction} next={next} />
      )}
    </AuthShell>
  );
}
