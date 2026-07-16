"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";

interface SignInFormProps {
  action?: AuthFormAction;
  next: string;
}

type AuthFormAction = (
  previousState: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

const initialState: AuthFormState = {
  ok: true,
  message: "",
};

async function inertAction(): Promise<AuthFormState> {
  return initialState;
}

export function SignInForm({ action = inertAction, next }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <header className="space-y-2 pb-1">
        <p className="mk-kicker text-xs font-black tracking-[0.16em] text-[var(--brand-hover)] uppercase">
          Accès membre
        </p>
        <h1 className="max-w-[14ch] text-3xl leading-[1.02] font-black tracking-[-0.045em] text-white sm:text-4xl">
          Bon retour dans la salle
        </h1>
      </header>

      <input name="next" type="hidden" value={next} />

      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-[var(--text-primary)]"
          htmlFor="sign-in-email"
        >
          Adresse e-mail
        </label>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-black/25 px-4 text-base text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-[var(--brand-hover)] focus:bg-black/35 focus:ring-2 focus:ring-[var(--brand-muted)]"
          id="sign-in-email"
          name="email"
          required
          type="email"
        />
      </div>

      <PasswordField
        autoComplete="current-password"
        id="sign-in-password"
        label="Mot de passe"
        name="password"
        required
      />

      <div className="flex justify-end">
        <Link
          className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--text-secondary)] underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
          href="/forgot-password"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {state.message ? (
        <InlineNotice tone={state.ok ? "success" : "error"}>
          {state.message}
        </InlineNotice>
      ) : null}

      <Button
        aria-busy={pending}
        className="w-full text-[#08080b]"
        disabled={pending}
        type="submit"
      >
        <span>SE CONNECTER</span>
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin"
            data-pending-indicator="true"
            size={17}
          />
        ) : (
          <ArrowRight aria-hidden="true" size={17} />
        )}
      </Button>
    </form>
  );
}
