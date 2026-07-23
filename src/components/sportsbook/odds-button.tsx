"use client";

import { Button } from "@astryxdesign/core/Button";
import { ArrowDown, ArrowRight, ArrowUp, Lock } from "lucide-react";

import { useOptionalBetSlip } from "@/components/sportsbook/bet-slip-context";
import type { MarketStatus } from "@/domain/database/enums";
import type {
  BetSlipSelection,
  OddsMovement,
} from "@/fixtures/sportsbook/types";

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
  if (movement === "UP") return "cote en hausse";
  if (movement === "DOWN") return "cote en baisse";
  return "cote stable";
}

function MovementIcon({ movement }: { movement: OddsMovement }) {
  if (movement === "UP") {
    return <ArrowUp aria-hidden="true" className="h-4 w-4" />;
  }
  if (movement === "DOWN") {
    return <ArrowDown aria-hidden="true" className="h-4 w-4" />;
  }
  return <ArrowRight aria-hidden="true" className="h-4 w-4" />;
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
  const disabled = status !== "OPEN";
  const isSelected = betSlip
    ? betSlip.isSelected(marketId, outcomeId)
    : selected;
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
  const accessibleLabel = `${outcomeLabel}, cote ${formatOdds(odds)}, ${
    suspended
      ? "suspendu"
      : status === "OPEN"
        ? "marché ouvert"
        : "marché fermé"
  }, ${movementText(movement)}${detail ? `, ${detail}` : ""}`;
  const movementLabel =
    movement === "UP"
      ? "En hausse"
      : movement === "DOWN"
        ? "En baisse"
        : "Stable";

  return (
    <Button
      aria-pressed={isSelected}
      className="min-h-16 justify-between px-4 text-left"
      data-market-id={marketId}
      data-outcome-id={outcomeId}
      endContent={
        <span className="flex items-center gap-1 text-xs">
          {suspended ? (
            <>
              <Lock aria-hidden="true" className="h-4 w-4" /> Suspendu
            </>
          ) : (
            <>
              <MovementIcon movement={movement} /> {movementLabel}
            </>
          )}
        </span>
      }
      isDisabled={disabled}
      label={accessibleLabel}
      onClick={() => betSlip?.toggleSelection(selection)}
      variant={isSelected ? "primary" : "secondary"}
      width="100%"
    >
      <span className="flex flex-col items-start">
        <span className="text-xs">{outcomeLabel}</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatOdds(odds)}
        </span>
      </span>
    </Button>
  );
}
