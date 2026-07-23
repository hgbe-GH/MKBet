"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { AuthTextInput } from "@/components/auth/auth-text-input";

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
      <Card data-status="success" padding={6} role="status" variant="green">
        <VStack gap={4}>
          <Heading level={1}>Consulte ta boîte mail</Heading>
          <Text as="p">{state.message}</Text>
          <Link
            className="font-bold underline underline-offset-4"
            href="/login"
          >
            Revenir à la connexion
          </Link>
        </VStack>
      </Card>
    );
  }

  const status = pending ? "pending" : hasError ? "error" : "idling";

  return (
    <form action={formAction} aria-busy={pending} data-status={status}>
      <VStack gap={5}>
        <header className="space-y-2 pb-1">
          <Text color="secondary" type="label">
            Récupération
          </Text>
          <Heading level={1}>Retrouver mon accès</Heading>
        </header>

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

        {state.message ? (
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
          label="Envoyer l’e-mail"
          size="lg"
          type="submit"
          variant="primary"
          width="100%"
        />
        <span aria-live="polite" className="sr-only" role="status">
          {pending ? "Envoi de l’e-mail en cours." : ""}
        </span>
      </VStack>
    </form>
  );
}
