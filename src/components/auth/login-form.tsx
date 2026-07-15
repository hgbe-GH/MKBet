"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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
          className="min-h-12 w-full rounded-md border border-stone-300 px-4 text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
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
          className="min-h-12 w-full rounded-md border border-stone-300 px-4 text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          id="displayName"
          name="displayName"
          type="text"
        />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "ENVOI EN COURS" : "RECEVOIR MON LIEN D’ACCÈS"}
      </Button>
      {state.message ? (
        <p className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
          {state.message}
        </p>
      ) : null}
      <p className="text-sm leading-6 text-stone-600">
        Un compte donne accès à la salle privée et à 1 000 MKB fictifs. Aucun
        pari en argent réel.
      </p>
    </form>
  );
}
