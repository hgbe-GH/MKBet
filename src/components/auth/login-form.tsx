"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import type { AuthFormState } from "@/application/auth/actions";

interface LoginFormProps {
  next: string;
  action?: (
    previousState: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
}

const initialState: AuthFormState = {
  ok: true,
  message: "",
};

async function inertAction(): Promise<AuthFormState> {
  return initialState;
}

export function LoginForm({ next, action = inertAction }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.ok && state.message) {
    return (
      <InlineNotice tone="success">
        <h1 className="text-2xl font-black text-white">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-2 leading-6">{state.message}</p>
      </InlineNotice>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <h1 className="text-3xl font-black tracking-[-0.035em]">
        Rejoindre Margot × Kévin
      </h1>
      <input name="next" type="hidden" value={next} />
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-900" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-white/[0.07] px-4 text-white"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-bold text-stone-900"
          htmlFor="displayName"
        >
          Nom d’affichage
        </label>
        <input
          autoComplete="nickname"
          className="min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-white/[0.07] px-4 text-white"
          id="displayName"
          name="displayName"
          type="text"
        />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "ENVOI EN COURS" : "RECEVOIR MON LIEN D’ACCÈS"}
      </Button>
      {state.message ? (
        <InlineNotice tone={state.ok ? "success" : "error"}>
          {state.message}
        </InlineNotice>
      ) : null}
      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        Un compte donne accès à la salle privée et à 1 000 MKB fictifs. Aucun
        pari en argent réel.
      </p>
    </form>
  );
}
