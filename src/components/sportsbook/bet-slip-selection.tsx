"use client";

import { X } from "lucide-react";

import { useBetSlip } from "@/components/sportsbook/bet-slip-context";
import type { BetSlipSelection } from "@/fixtures/sportsbook/types";

export function BetSlipSelectionItem({
  selection,
}: {
  selection: BetSlipSelection;
}) {
  const betSlip = useBetSlip();

  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{selection.marketTitle}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {selection.outcomeLabel} · cote{" "}
            {selection.odds.toFixed(2).replace(".", ",")}
          </p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Version {selection.oddsVersion}
          </p>
        </div>
        <button
          aria-label={`Retirer ${selection.outcomeLabel}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-white"
          onClick={() =>
            betSlip.removeSelection(selection.marketId, selection.outcomeId)
          }
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
