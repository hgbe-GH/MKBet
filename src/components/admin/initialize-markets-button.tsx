"use client";

import { useState, useTransition } from "react";

import { initializeDefaultMarketsAction } from "@/application/markets/admin-actions";
import { Button } from "@/components/ui/button";

export function InitializeMarketsButton({
  seasonId,
  physicalDeadlineAt,
  relationshipDeadlineAt,
  closesAt,
}: {
  seasonId: string;
  physicalDeadlineAt: string;
  relationshipDeadlineAt: string;
  closesAt: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const initialize = () => {
    if (
      !window.confirm(
        `Créer les sept marchés ? Physiques : ${new Date(physicalDeadlineAt).toLocaleString("fr-FR")}. Statuts : ${new Date(relationshipDeadlineAt).toLocaleString("fr-FR")}.`,
      )
    )
      return;
    startTransition(async () => {
      const result = await initializeDefaultMarketsAction({
        seasonId,
        physicalDeadlineAt,
        relationshipDeadlineAt,
        closesAt,
        idempotencyKey: crypto.randomUUID(),
      });
      setMessage(result.message);
    });
  };
  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)]">
        Échéances proposées : J+30 pour les marchés physiques, J+90 pour les
        statuts sensibles. Clôture à J+29.
      </p>
      <Button
        className="mt-3"
        disabled={pending}
        onClick={initialize}
        type="button"
      >
        {pending ? "INITIALISATION…" : "INITIALISER LES 7 MARCHÉS"}
      </Button>
      <p aria-live="polite" className="mt-2 text-sm">
        {message}
      </p>
    </div>
  );
}
