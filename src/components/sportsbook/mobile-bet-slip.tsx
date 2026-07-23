"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { useRef, useState } from "react";

import { BetSlip } from "@/components/sportsbook/bet-slip";
import { useBetSlip } from "@/components/sportsbook/bet-slip-context";

export function MobileBetSlip({
  balanceMkb,
  seasonId,
}: {
  balanceMkb: number;
  seasonId: string;
}) {
  const [open, setOpen] = useState(false);
  const [potentialReturnMkb, setPotentialReturnMkb] = useState<number | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const betSlip = useBetSlip();
  const potentialReturnSummary =
    potentialReturnMkb === null
      ? "Retour après devis"
      : `Retour potentiel ${potentialReturnMkb} MKB`;

  const updateOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  return (
    <>
      <div className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-30 lg:right-3 lg:left-3 xl:hidden">
        <Card padding={2}>
          <Button
            endContent={
              <Badge
                label={betSlip.selections.length}
                variant={betSlip.selections.length > 0 ? "info" : "neutral"}
              />
            }
            label={`Ouvrir le ticket, ${betSlip.selections.length} sélection${
              betSlip.selections.length > 1 ? "s" : ""
            }, ${potentialReturnSummary.toLocaleLowerCase("fr-FR")}`}
            onClick={() => setOpen(true)}
            ref={triggerRef}
            size="lg"
            variant="secondary"
            width="100%"
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span>Ouvrir le ticket</span>
              <span className="text-xs">{potentialReturnSummary}</span>
            </span>
          </Button>
        </Card>
      </div>

      <Dialog
        aria-label="Ticket de pari"
        isOpen={open}
        maxHeight="calc(100dvh - 2rem)"
        onOpenChange={updateOpen}
        position={{ bottom: "1rem" }}
        purpose="info"
        width="min(34rem, calc(100vw - 2rem))"
      >
        <Layout
          height="auto"
          header={
            <DialogHeader
              endContent={
                <Button
                  label="Fermer"
                  onClick={() => updateOpen(false)}
                  variant="ghost"
                />
              }
              hasDivider
              title="Ticket de pari"
            />
          }
          content={
            <LayoutContent isScrollable padding={0}>
              <BetSlip
                balanceMkb={balanceMkb}
                onPotentialReturnChange={setPotentialReturnMkb}
                seasonId={seasonId}
              />
            </LayoutContent>
          }
        />
      </Dialog>
    </>
  );
}
