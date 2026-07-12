"use client";

import { useState, useTransition } from "react";

import { changeMarketStatusAction } from "@/application/markets/admin-actions";
import { Button } from "@/components/ui/button";
import type { MarketStatus } from "@/domain/database/enums";

export function MarketStatusControls({
  marketId,
  status,
}: {
  marketId: string;
  status: MarketStatus;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (action: "SUSPEND" | "REOPEN" | "CLOSE") => {
    if (!window.confirm(`Confirmer l'action ${action} sur ce marché ?`)) return;
    startTransition(async () => {
      const result = await changeMarketStatusAction({ marketId, action });
      setMessage(result.message);
    });
  };
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "OPEN" ? (
        <Button
          disabled={pending}
          onClick={() => run("SUSPEND")}
          variant="outline"
        >
          Suspendre
        </Button>
      ) : null}
      {status === "SUSPENDED" ? (
        <Button
          disabled={pending}
          onClick={() => run("REOPEN")}
          variant="outline"
        >
          Rouvrir
        </Button>
      ) : null}
      {["DRAFT", "OPEN", "SUSPENDED"].includes(status) ? (
        <Button
          disabled={pending}
          onClick={() => run("CLOSE")}
          variant="outline"
        >
          Fermer
        </Button>
      ) : null}
      <span aria-live="polite" className="text-xs text-[var(--text-muted)]">
        {message}
      </span>
    </div>
  );
}
