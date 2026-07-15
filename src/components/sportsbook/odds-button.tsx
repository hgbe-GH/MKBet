"use client";

import { ArrowDown, ArrowRight, ArrowUp, Lock } from "lucide-react";

import { useOptionalBetSlip } from "@/components/sportsbook/bet-slip-context";
import { cn } from "@/lib/utils";
import type {
  BetSlipSelection,
  OddsMovement,
} from "@/fixtures/sportsbook/types";
import type { MarketStatus } from "@/domain/database/enums";

interface OddsButtonProps {
  marketId: string;
  marketTitle?: string;
  outcomeId: string;
  outcomeLabel: string;
  odds: number;
  oddsVersion: number;
  status: MarketStatus;
  selected: boolean;
  movement: OddsMovement;
  line?: number;
  handicap?: string;
}

function formatOdds(odds: number) {
  return odds.toFixed(2).replace(".", ",");
}

function movementText(movement: OddsMovement) {
  if (movement === "UP") {
    return "cote en hausse";
  }
  if (movement === "DOWN") {
    return "cote en baisse";
  }
  return "cote stable";
}

function MovementIcon({ movement }: { movement: OddsMovement }) {
  if (movement === "UP") {
    return <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />;
  }
  if (movement === "DOWN") {
    return <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />;
  }
  return <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />;
}

export function OddsButton({
  marketId,
  marketTitle = "Marché",
  outcomeId,
  outcomeLabel,
  odds,
  oddsVersion,
  status,
  selected,
  movement,
  line,
  handicap,
}: OddsButtonProps) {
  const betSlip = useOptionalBetSlip();
  const suspended = status === "SUSPENDED";
  const disabled = suspended || status !== "OPEN";
  const selection: BetSlipSelection = {
    marketId,
    marketTitle,
    outcomeId,
    outcomeLabel,
    odds,
    oddsVersion,
    status,
    movement,
  };
  const detail = [line ? `ligne ${line}` : null, handicap ?? null]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      aria-label={`${outcomeLabel}, cote ${formatOdds(odds)}, ${
        suspended ? "suspendu" : "marché ouvert"
      }, ${movementText(movement)}${detail ? `, ${detail}` : ""}`}
      aria-pressed={selected}
      data-market-id={marketId}
      data-outcome-id={outcomeId}
      className={cn(
        "min-h-14 rounded-xl border px-3 py-2 text-left transition duration-200 hover:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        "flex items-center justify-between gap-3",
        selected
          ? "-translate-y-0.5 border-[var(--brand)] bg-[var(--selected-odds)] text-white shadow-[0_0_24px_rgba(255,52,83,0.28)]"
          : "border-[var(--border)] bg-white/[0.06] text-[var(--text-primary)] hover:bg-white/[0.1]",
        disabled &&
          "cursor-not-allowed bg-white/[0.035] text-[var(--text-muted)] opacity-60",
      )}
      disabled={disabled}
      onClick={() => betSlip?.toggleSelection(selection)}
      type="button"
    >
      <span>
        <span className="block text-xs font-bold text-[var(--text-secondary)]">
          {outcomeLabel}
        </span>
        <span className="block text-lg font-black tabular-nums">
          {formatOdds(odds)}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1 text-[0.68rem] font-bold uppercase tracking-[0.08em]">
        {suspended ? (
          <>
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            Suspendu
          </>
        ) : (
          <>
            <MovementIcon movement={movement} />
            {movement === "UP"
              ? "En hausse"
              : movement === "DOWN"
                ? "En baisse"
                : "Stable"}
          </>
        )}
      </span>
    </button>
  );
}
