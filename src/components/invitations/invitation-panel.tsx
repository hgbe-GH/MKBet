"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useActionState } from "react";

import type { InvitationFormState } from "@/application/invitations/actions";
import type { InvitationPreview } from "@/application/invitations/types";

interface InvitationPanelProps {
  preview: InvitationPreview;
  isAuthenticated: boolean;
  nextPath: string;
  token?: string;
  action?: (
    previousState: InvitationFormState,
    formData: FormData,
  ) => Promise<InvitationFormState>;
}

const initialState: InvitationFormState = {
  ok: true,
  message: "",
};

async function inertAction(): Promise<InvitationFormState> {
  return initialState;
}

function invalidMessage(reason: InvitationPreview["reason"]): string {
  if (reason === "INVITATION_EXPIRED") {
    return "Ce ticket d’entrée n’est plus coté.";
  }
  if (reason === "INVITATION_ALREADY_USED") {
    return "Cette invitation a déjà clôturé.";
  }
  if (reason === "INVITATION_EMAIL_MISMATCH") {
    return "Cette invitation est réservée à une autre adresse.";
  }
  return "Cette invitation est invalide.";
}

export function InvitationPanel({
  preview,
  isAuthenticated,
  nextPath,
  token,
  action = inertAction,
}: InvitationPanelProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const status = pending
    ? "pending"
    : state.message
      ? state.ok
        ? "success"
        : "error"
      : "idling";

  if (!preview.isValid) {
    return (
      <Card data-status="error" padding={6} variant="muted">
        <VStack gap={4}>
          <Badge label="Invitation privée" variant="error" />
          <Heading level={1}>Invitation indisponible</Heading>
          <Text as="p" color="secondary">
            {invalidMessage(preview.reason)}
          </Text>
        </VStack>
      </Card>
    );
  }

  return (
    <Card data-status={status} padding={6}>
      <VStack gap={5}>
        <Badge label="Invitation privée" variant="red" />
        <Heading level={1}>
          Tu as été convoqué dans la salle des marchés.
        </Heading>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-bold text-[var(--color-text-secondary)]">
              Saison
            </dt>
            <dd>{preview.seasonTitle}</dd>
          </div>
          <div>
            <dt className="font-bold text-[var(--color-text-secondary)]">
              Rôle proposé
            </dt>
            <dd>
              {preview.proposedRole}
              {preview.proposedSubjectKey
                ? ` ${preview.proposedSubjectKey}`
                : ""}
            </dd>
          </div>
          {preview.maskedEmail ? (
            <div>
              <dt className="font-bold text-[var(--color-text-secondary)]">
                Email réservé
              </dt>
              <dd>{preview.maskedEmail}</dd>
            </div>
          ) : null}
        </dl>
        {isAuthenticated ? (
          <form action={formAction} aria-busy={pending}>
            <VStack gap={3}>
              <input name="token" type="hidden" value={token ?? ""} />
              <Button
                isDisabled={pending}
                isLoading={pending}
                label="Accepter l’invitation"
                size="lg"
                type="submit"
                variant="primary"
              />
              <span aria-live="polite" className="sr-only" role="status">
                {pending ? "Acceptation en cours." : ""}
              </span>
              {state.message ? (
                <Banner
                  status={state.ok ? "success" : "error"}
                  title={state.message}
                />
              ) : null}
            </VStack>
          </form>
        ) : (
          <Button
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            label="Se connecter"
            size="lg"
            variant="primary"
          />
        )}
      </VStack>
    </Card>
  );
}
