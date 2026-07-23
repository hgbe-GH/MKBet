"use client";

import { Button } from "@astryxdesign/core/Button";
import { ListItem } from "@astryxdesign/core/List";
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
    <ListItem
      description={`${selection.outcomeLabel} · cote ${selection.odds
        .toFixed(2)
        .replace(".", ",")} · version ${selection.oddsVersion}`}
      endContent={
        <Button
          icon={<X aria-hidden="true" />}
          isIconOnly
          label={`Retirer ${selection.outcomeLabel}`}
          onClick={() =>
            betSlip.removeSelection(selection.marketId, selection.outcomeId)
          }
          variant="ghost"
        />
      }
      label={selection.marketTitle}
    />
  );
}
