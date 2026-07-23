"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { AuthTextInput } from "@/components/auth/auth-text-input";
import { PasswordField } from "@/components/auth/password-field";

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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const displayNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hasError = !state.ok;
  const errorId = hasError ? "sign-up-error" : undefined;

  useEffect(() => {
    if (hasError) {
      displayNameRef.current?.focus();
    }
  }, [hasError, state]);

  const status = pending ? "pending" : hasError ? "error" : "idling";

  return (
    <form action={formAction} aria-busy={pending} data-status={status}>
      <VStack gap={5}>
        <header className="space-y-2 pb-1">
          <Text color="secondary" type="label">
            Nouveau joueur
          </Text>
          <Heading level={1}>Créer mon compte</Heading>
        </header>

        <input name="next" type="hidden" value={next} />

        <AuthTextInput
          autoComplete="nickname"
          describedBy={errorId}
          htmlName="displayName"
          label="Nom d’affichage"
          maxLength={80}
          onChange={setDisplayName}
          ref={displayNameRef}
          required
          size="lg"
          spellCheck={false}
          status={hasError ? { type: "error" } : undefined}
          type="text"
          value={displayName}
          width="100%"
        />

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
          autoComplete="new-password"
          describedBy={errorId}
          id="sign-up-password"
          invalid={hasError}
          label="Mot de passe"
          minLength={10}
          name="password"
          required
        />
        <PasswordField
          autoComplete="new-password"
          describedBy={errorId}
          id="sign-up-password-confirmation"
          invalid={hasError}
          label="Confirmer le mot de passe"
          minLength={10}
          name="passwordConfirmation"
          required
          visibilityContext="confirmation"
        />

        {hasError && state.message ? (
          <Banner id={errorId} status="error" title={state.message} />
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
          label="Créer mon compte"
          size="lg"
          type="submit"
          variant="primary"
          width="100%"
        />
        <span aria-live="polite" className="sr-only" role="status">
          {pending ? "Création du compte en cours." : ""}
        </span>

        <Text as="p" color="secondary" type="supporting">
          Ton compte reçoit 1 000 MKB fictifs. Aucun pari en argent réel.
        </Text>
      </VStack>
    </form>
  );
}
