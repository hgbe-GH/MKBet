"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";

interface SignUpFormProps {
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

export function SignUpForm({ action = inertAction, next }: SignUpFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.ok && state.message) {
    return (
      <InlineNotice className="space-y-3 p-5 sm:p-6" tone="success">
        <p className="mk-eyebrow">Compte presque prêt</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-white">
          Confirme ton adresse
        </h1>
        <p className="leading-6">{state.message}</p>
        <p className="border-t border-emerald-300/20 pt-3 text-sm leading-6">
          Après confirmation, 1 000 MKB fictifs t’attendent dans la salle. Aucun
          pari en argent réel.
        </p>
      </InlineNotice>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <header className="space-y-2 pb-1">
        <p className="mk-kicker text-xs font-black tracking-[0.16em] text-[var(--brand-hover)] uppercase">
          Nouveau joueur
        </p>
        <h1 className="text-3xl leading-[1.02] font-black tracking-[-0.045em] text-white sm:text-4xl">
          Créer mon compte
        </h1>
      </header>

      <input name="next" type="hidden" value={next} />

      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-[var(--text-primary)]"
          htmlFor="sign-up-display-name"
        >
          Nom d’affichage
        </label>
        <input
          autoComplete="nickname"
          className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-black/25 px-4 text-base text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-[var(--brand-hover)] focus:bg-black/35 focus:ring-2 focus:ring-[var(--brand-muted)]"
          id="sign-up-display-name"
          name="displayName"
          required
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-[var(--text-primary)]"
          htmlFor="sign-up-email"
        >
          Adresse e-mail
        </label>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-black/25 px-4 text-base text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-[var(--brand-hover)] focus:bg-black/35 focus:ring-2 focus:ring-[var(--brand-muted)]"
          id="sign-up-email"
          name="email"
          required
          type="email"
        />
      </div>

      <PasswordField
        autoComplete="new-password"
        id="sign-up-password"
        label="Mot de passe"
        minLength={10}
        name="password"
        required
      />
      <PasswordField
        autoComplete="new-password"
        id="sign-up-password-confirmation"
        label="Confirmer le mot de passe"
        minLength={10}
        name="passwordConfirmation"
        required
      />

      {state.message ? (
        <InlineNotice tone="error">{state.message}</InlineNotice>
      ) : null}

      <Button
        aria-busy={pending}
        className="w-full text-[#08080b]"
        disabled={pending}
        type="submit"
      >
        <span>CRÉER MON COMPTE</span>
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

      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        Ton compte reçoit 1 000 MKB fictifs. Aucun pari en argent réel.
      </p>
    </form>
  );
}
