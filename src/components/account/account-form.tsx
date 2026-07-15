"use client";

import { useActionState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { Button } from "@/components/ui/button";

interface AccountFormProps {
  displayName: string;
  avatarUrl: string | null;
  action: (
    previousState: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
}

const initialState: AuthFormState = { ok: true, message: "" };

export function AccountForm({
  displayName,
  avatarUrl,
  action,
}: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="displayName">
          Nom d’affichage
        </label>
        <input
          className="min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-white/[0.07] px-4 text-white"
          defaultValue={displayName}
          id="displayName"
          name="displayName"
          required
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="avatarUrl">
          Avatar URL
        </label>
        <input
          className="min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-white/[0.07] px-4 text-white"
          defaultValue={avatarUrl ?? ""}
          id="avatarUrl"
          name="avatarUrl"
          type="url"
        />
      </div>
      <Button disabled={pending} type="submit">
        Enregistrer
      </Button>
      {state.message ? (
        <p className="text-sm text-[var(--text-secondary)]">{state.message}</p>
      ) : null}
    </form>
  );
}
