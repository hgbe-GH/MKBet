"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";

type AuthFormAction = (
  previousState: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface UpdatePasswordFormProps {
  action: AuthFormAction;
}

const initialState: AuthFormState = { ok: true, message: "" };

export function UpdatePasswordForm({ action }: UpdatePasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const hasError = !state.ok;
  const errorId = hasError ? "update-password-error" : undefined;

  useEffect(() => {
    if (hasError) {
      formRef.current?.reset();
      passwordRef.current?.focus();
    }
  }, [hasError, state]);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <header className="space-y-2 pb-1">
        <p className="mk-kicker text-xs font-black tracking-[0.16em] text-[var(--brand-hover)] uppercase">
          Sécurité
        </p>
        <h1 className="text-3xl leading-[1.02] font-black tracking-[-0.045em] text-white sm:text-4xl">
          Choisir un nouveau mot de passe
        </h1>
      </header>

      <PasswordField
        autoComplete="new-password"
        describedBy={errorId}
        id="update-password"
        inputRef={passwordRef}
        invalid={hasError}
        label="Nouveau mot de passe"
        minLength={10}
        name="password"
        required
      />
      <PasswordField
        autoComplete="new-password"
        describedBy={errorId}
        id="update-password-confirmation"
        invalid={hasError}
        label="Confirmer le nouveau mot de passe"
        minLength={10}
        name="passwordConfirmation"
        required
        visibilityContext="confirmation"
      />

      {state.message ? (
        <div id={errorId}>
          <InlineNotice tone="error">{state.message}</InlineNotice>
        </div>
      ) : null}

      <Button
        aria-busy={pending}
        className="w-full text-[#08080b]"
        disabled={pending}
        type="submit"
      >
        <span>MODIFIER LE MOT DE PASSE</span>
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
