"use client";

import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { List } from "@astryxdesign/core/List";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, useTransition } from "react";

import { createBetQuoteAction } from "@/application/betting/create-bet-quote-action";
import { placeBetAction } from "@/application/betting/place-bet-action";
import type { BetQuoteResult } from "@/application/betting/types";
import { BetSlipSelectionItem } from "@/components/sportsbook/bet-slip-selection";
import { useBetSlip } from "@/components/sportsbook/bet-slip-context";

function remainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
}

export function BetSlip({
  balanceMkb,
  onPotentialReturnChange,
  seasonId,
}: {
  balanceMkb: number;
  onPotentialReturnChange?: (potentialReturnMkb: number | null) => void;
  seasonId: string;
}) {
  const betSlip = useBetSlip();
  const toast = useToast();
  const [stake, setStake] = useState("10");
  const [stakeRevision, setStakeRevision] = useState(0);
  const [quote, setQuote] = useState<BetQuoteResult | null>(null);
  const [quoteBasis, setQuoteBasis] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [changedFromOdds, setChangedFromOdds] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [displayedBalance, setDisplayedBalance] = useState(balanceMkb);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const stakeId = useId();
  const stakeDescriptionId = `${stakeId}-description`;
  const stakeNumber = Number(stake);
  const stakeValid =
    Number.isInteger(stakeNumber) &&
    Number.isFinite(stakeNumber) &&
    stakeNumber >= 5 &&
    stakeNumber <= displayedBalance;
  const selectionKey = useMemo(
    () => betSlip.selections.map((selection) => selection.outcomeId).join(":"),
    [betSlip.selections],
  );
  const currentBasis = `${betSlip.revision}|${stakeRevision}|${selectionKey}|${stake}`;
  const activeQuote = quoteBasis === currentBasis ? quote : null;
  const ticketStep = activeQuote
    ? "quote"
    : betSlip.selections.length > 0
      ? "selection"
      : "empty";
  const ticketLabel =
    betSlip.selections.length === 1
      ? "Simple"
      : betSlip.selections.length > 1
        ? `Combiné ${betSlip.selections.length} sélections`
        : "Ticket vide";

  useEffect(() => {
    if (!activeQuote) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(remainingSeconds(activeQuote.expiresAt));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [activeQuote]);

  useEffect(() => {
    onPotentialReturnChange?.(
      activeQuote && secondsLeft > 0 ? activeQuote.potentialReturnMkb : null,
    );
  }, [activeQuote, onPotentialReturnChange, secondsLeft]);

  const announce = (message: string, type: "info" | "error" = "info") => {
    setFeedback(message);
    toast({ body: message, type, uniqueID: "bet-slip-feedback" });
  };

  const verifyTicket = () => {
    if (!stakeValid || betSlip.selections.length === 0 || isPending) return;
    startTransition(async () => {
      const result = await createBetQuoteAction({
        seasonId,
        stakeMkb: stakeNumber,
        outcomeIds: betSlip.selections.map((selection) => selection.outcomeId),
        idempotencyKey: crypto.randomUUID(),
      });
      if (!result.ok) {
        announce(result.message, "error");
        return;
      }
      setQuote(result.quote);
      setQuoteBasis(currentBasis);
      setSecondsLeft(remainingSeconds(result.quote.expiresAt));
      announce("Devis confirmé par MK Bet. Vérifie les cotes avant de placer.");
    });
  };

  const placeTicket = () => {
    if (!activeQuote || secondsLeft <= 0 || isPending) return;
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await placeBetAction({
        quoteId: activeQuote.quoteId,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!result.ok) {
        announce(result.message, "error");
        if (result.code === "ODDS_CHANGED" || result.code === "QUOTE_EXPIRED") {
          if (result.code === "ODDS_CHANGED") {
            setChangedFromOdds(activeQuote.totalOdds);
          }
          setQuote(null);
          setQuoteBasis("");
          setSecondsLeft(0);
        }
        return;
      }
      setDisplayedBalance(result.bet.balanceMkb);
      setTicketNumber(result.bet.ticketNumber);
      announce("Pronostic enregistré. Ta dignité est désormais engagée.");
      setQuote(null);
      setQuoteBasis("");
      setChangedFromOdds(null);
      setSecondsLeft(0);
      betSlip.clearSelections();
    });
  };

  const actionLabel = isPending
    ? "VÉRIFICATION…"
    : feedback.includes("évolué")
      ? "ACCEPTER LES NOUVELLES COTES"
      : "VÉRIFIER LE TICKET";

  return (
    <>
      <Card
        aria-label="Ticket de pari"
        data-ticket-step={ticketStep}
        padding={4}
        role="complementary"
      >
        <VStack gap={4}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge label="Ticket" variant="info" />
              <Heading className="mt-2" level={2}>
                {ticketLabel}
              </Heading>
              <Text color="secondary" type="supporting">
                {betSlip.selections.length} sélection
                {betSlip.selections.length > 1 ? "s" : ""}
              </Text>
            </div>
            <Button
              isDisabled={betSlip.selections.length === 0}
              label="Vider"
              onClick={betSlip.clearSelections}
              variant="ghost"
            />
          </div>

          <p aria-live="polite" className="sr-only" role="status">
            {feedback || betSlip.message}
          </p>
          {feedback || betSlip.message ? (
            <Card padding={3} variant="muted">
              <Text type="supporting">{feedback || betSlip.message}</Text>
            </Card>
          ) : null}

          {ticketNumber ? (
            <Card padding={3} variant="green">
              <Text type="supporting">
                Ticket #{ticketNumber}.{" "}
                <Link className="underline" href="/bets">
                  Voir mes paris
                </Link>
              </Text>
            </Card>
          ) : null}

          {betSlip.selections.length === 0 ? (
            <Text as="p" color="secondary">
              Tes amis prennent peut-être de mauvaises décisions pendant que ton
              ticket reste vide.
            </Text>
          ) : (
            <List density="compact" hasDividers>
              {betSlip.selections.map((selection) => (
                <BetSlipSelectionItem
                  key={`${selection.marketId}:${selection.outcomeId}`}
                  selection={selection}
                />
              ))}
            </List>
          )}

          <div className="space-y-1">
            <label className="font-semibold" htmlFor={stakeId}>
              Mise en MKB
            </label>
            <input
              aria-describedby={stakeDescriptionId}
              className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              id={stakeId}
              inputMode="decimal"
              max={displayedBalance}
              min="5"
              onChange={(event) => {
                setStake(event.target.value);
                setStakeRevision((revision) => revision + 1);
              }}
              step="1"
              type="number"
              value={stake}
            />
            <Text
              className={
                stakeValid ? undefined : "text-[var(--color-text-warning)]"
              }
              color="secondary"
              id={stakeDescriptionId}
              type="supporting"
            >
              {stakeValid
                ? `Mise minimale : 5 MKB · solde : ${displayedBalance} MKB`
                : stakeNumber < 5
                  ? "Mise minimale : 5 MKB."
                  : `Solde disponible : ${displayedBalance} MKB.`}
            </Text>
          </div>

          <MetadataList columns={2}>
            <MetadataListItem label="Cote définitive">
              {activeQuote
                ? activeQuote.totalOdds.toFixed(2).replace(".", ",")
                : "À vérifier"}
            </MetadataListItem>
            <MetadataListItem label="Retour potentiel">
              {activeQuote ? `${activeQuote.potentialReturnMkb} MKB` : "—"}
            </MetadataListItem>
          </MetadataList>

          {activeQuote ? (
            <Text color="secondary" type="supporting">
              La cote totale et le retour potentiel affichés proviennent
              uniquement du devis actif.
            </Text>
          ) : null}

          {activeQuote?.correlationAdjustment ? (
            <Text
              className="text-[var(--color-text-warning)]"
              type="supporting"
            >
              PostgreSQL applique la corrélation exacte (coefficient{" "}
              {activeQuote.correlationAdjustment.toFixed(2)}) : aucune
              multiplication de cotes n’est calculée côté navigateur.
            </Text>
          ) : null}
          {changedFromOdds !== null && activeQuote ? (
            <Card padding={3} variant="yellow">
              <Text type="supporting">
                Ancienne cote {changedFromOdds.toFixed(2)} · nouvelle cote{" "}
                {activeQuote.totalOdds.toFixed(2)} · nouveau retour{" "}
                {activeQuote.potentialReturnMkb} MKB. Une nouvelle confirmation
                est obligatoire.
              </Text>
            </Card>
          ) : null}
          {activeQuote ? (
            <ProgressBar
              formatValueLabel={(value) => `${value} s`}
              hasValueLabel
              label="Validité du devis"
              max={60}
              value={secondsLeft}
              variant={secondsLeft > 10 ? "accent" : "warning"}
            />
          ) : null}

          {activeQuote ? (
            secondsLeft > 0 ? (
              <Button
                isDisabled={isPending}
                isLoading={isPending}
                label="PLACER MON PRONOSTIC"
                onClick={() => setConfirmOpen(true)}
                variant="primary"
                width="100%"
              />
            ) : (
              <Button
                isDisabled={isPending}
                isLoading={isPending}
                label="ACTUALISER LES COTES"
                onClick={verifyTicket}
                variant="primary"
                width="100%"
              />
            )
          ) : (
            <Button
              isDisabled={
                isPending || !stakeValid || betSlip.selections.length === 0
              }
              isLoading={isPending}
              label={actionLabel}
              onClick={verifyTicket}
              variant="primary"
              width="100%"
            />
          )}
          <details className="text-xs leading-5 text-[var(--color-text-secondary)]">
            <summary className="cursor-pointer font-semibold">
              Comment le ticket est sécurisé
            </summary>
            <Text as="p" className="mt-2" color="secondary" type="supporting">
              Le navigateur envoie seulement les issues, la mise et une clé
              d’idempotence. PostgreSQL fixe les cotes et débite atomiquement
              les MKB fictifs.
            </Text>
          </details>
        </VStack>
      </Card>
      <AlertDialog
        actionLabel="Confirmer le pari"
        actionVariant="primary"
        cancelLabel="Annuler"
        description="La mise sera débitée atomiquement en MKB fictifs selon le devis affiché."
        isActionLoading={isPending}
        isOpen={confirmOpen}
        onAction={placeTicket}
        onOpenChange={setConfirmOpen}
        title="Placer ce pronostic ?"
      />
    </>
  );
}
