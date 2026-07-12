"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { InvitationFormState } from "@/application/invitations/actions";
import { Button } from "@/components/ui/button";
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

  if (!preview.isValid) {
    return (
      <section className="space-y-4 rounded-md border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-black text-stone-950">
          Invitation indisponible
        </h1>
        <p className="text-stone-600">{invalidMessage(preview.reason)}</p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-md border border-stone-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.14em] text-red-800 uppercase">
        Invitation privée
      </p>
      <h1 className="text-2xl font-black text-stone-950">
        Tu as été convoqué dans la salle des marchés.
      </h1>
      <dl className="grid gap-2 text-sm text-stone-700">
        <div>
          <dt className="font-bold">Saison</dt>
          <dd>{preview.seasonTitle}</dd>
        </div>
        <div>
          <dt className="font-bold">Rôle proposé</dt>
          <dd>
            {preview.proposedRole}
            {preview.proposedSubjectKey ? ` ${preview.proposedSubjectKey}` : ""}
          </dd>
        </div>
        {preview.maskedEmail ? (
          <div>
            <dt className="font-bold">Email réservé</dt>
            <dd>{preview.maskedEmail}</dd>
          </div>
        ) : null}
      </dl>
      {isAuthenticated ? (
        <form action={formAction}>
          <input name="token" type="hidden" value={token ?? ""} />
          <Button disabled={pending} type="submit">
            {pending ? "ACCEPTATION" : "ACCEPTER L’INVITATION"}
          </Button>
          {state.message ? (
            <p className="mt-3 text-sm text-stone-600">{state.message}</p>
          ) : null}
        </form>
      ) : (
        <Button asChild>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
            Se connecter
          </Link>
        </Button>
      )}
    </section>
  );
}
