"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { AuthTextInput } from "@/components/auth/auth-text-input";
import { PasswordField } from "@/components/auth/password-field";

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
  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const hasError = !state.ok;
  const errorId = hasError ? "sign-in-error" : undefined;

  useEffect(() => {
    if (hasError) {
      emailRef.current?.focus();
    }
  }, [hasError, state]);

  const status = pending ? "pending" : hasError ? "error" : "idling";

  return (
    <form action={formAction} aria-busy={pending} data-status={status}>
      <VStack gap={5}>
        <header className="space-y-2 pb-1">
          <Text color="secondary" type="label">
            Accès membre
          </Text>
          <Heading level={1}>Bon retour dans la salle</Heading>
        </header>

        <input name="next" type="hidden" value={next} />

        <AuthTextInput
          autoComplete="email"
          describedBy={errorId}
          htmlName="email"
          label="Adresse e-mail"
          maxLength={320}
          onChange={setEmail}
          ref={emailRef}
          required
          size="lg"
          spellCheck={false}
          status={hasError ? { type: "error" } : undefined}
          type="email"
          value={email}
          width="100%"
        />

        <PasswordField
          autoComplete="current-password"
          describedBy={errorId}
          id="sign-in-password"
          invalid={hasError}
          label="Mot de passe"
          name="password"
          required
        />

        <div className="flex justify-end">
          <Link
            className="text-sm underline underline-offset-4"
            href="/forgot-password"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {state.message ? (
          <Banner
            id={errorId}
            status={state.ok ? "success" : "error"}
            title={state.message}
          />
        ) : null}

        <Button
          endContent={
            pending ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                data-pending-indicator="true"
                size={17}
              />
            ) : undefined
          }
          isDisabled={pending}
          label="Se connecter"
          size="lg"
          type="submit"
          variant="primary"
          width="100%"
        />
        <span aria-live="polite" className="sr-only" role="status">
          {pending ? "Connexion en cours." : ""}
        </span>
      </VStack>
    </form>
  );
}
