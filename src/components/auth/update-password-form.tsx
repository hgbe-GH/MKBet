"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import type { AuthFormState } from "@/application/auth/actions";
import { PasswordField } from "@/components/auth/password-field";

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

  const status = pending ? "pending" : hasError ? "error" : "idling";

  return (
    <form
      action={formAction}
      aria-busy={pending}
      data-status={status}
      ref={formRef}
    >
      <VStack gap={5}>
        <header className="space-y-2 pb-1">
          <Text color="secondary" type="label">
            Sécurité
          </Text>
          <Heading level={1}>Choisir un nouveau mot de passe</Heading>
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
          resetSignal={hasError ? state : undefined}
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
          resetSignal={hasError ? state : undefined}
          visibilityContext="confirmation"
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
          label="Modifier le mot de passe"
          size="lg"
          type="submit"
          variant="primary"
          width="100%"
        />
        <span aria-live="polite" className="sr-only" role="status">
          {pending ? "Modification du mot de passe en cours." : ""}
        </span>
      </VStack>
    </form>
  );
}
