"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";

type AuthFormAction = (
  previousState: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface PasswordResetRequestFormProps {
  action: AuthFormAction;
}

const initialState: AuthFormState = { ok: true, message: "" };

export function PasswordResetRequestForm({
  action,
}: PasswordResetRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const hasError = !state.ok;
  const errorId = hasError ? "password-reset-error" : undefined;

  useEffect(() => {
    if (hasError) {
      emailRef.current?.focus();
    }
  }, [hasError, state]);

  if (state.ok && state.message) {
    return (
      <InlineNotice className="space-y-4 p-5 sm:p-6" tone="success">
        <h1 className="text-3xl font-black tracking-[-0.04em] text-white">
          Consulte ta boîte mail
        </h1>
        <p className="leading-6">{state.message}</p>
        <Link
          className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-4"
          href="/login"
        >
          Revenir à la connexion
        </Link>
      </InlineNotice>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <header className="space-y-2 pb-1">
        <p className="mk-kicker text-xs font-black tracking-[0.16em] text-[var(--brand-hover)] uppercase">
          Récupération
        </p>
        <h1 className="text-3xl leading-[1.02] font-black tracking-[-0.045em] text-white sm:text-4xl">
          Retrouver mon accès
        </h1>
      </header>

      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-[var(--text-primary)]"
          htmlFor="password-reset-email"
        >
          Adresse e-mail
        </label>
        <input
          aria-describedby={errorId}
          aria-invalid={hasError || undefined}
          autoComplete="email"
          className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-black/25 px-4 text-base text-white outline-none focus-visible:border-[var(--brand-hover)] focus-visible:ring-2 focus-visible:ring-[var(--brand-muted)]"
          id="password-reset-email"
          maxLength={320}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          ref={emailRef}
          required
          spellCheck={false}
          type="email"
          value={email}
        />
      </div>

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
        <span>ENVOYER L’E-MAIL</span>
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
