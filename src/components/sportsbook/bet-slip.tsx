"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createBetQuoteAction } from "@/application/betting/create-bet-quote-action";
import { placeBetAction } from "@/application/betting/place-bet-action";
import type { BetQuoteResult } from "@/application/betting/types";
import { BetSlipSelectionItem } from "@/components/sportsbook/bet-slip-selection";
import { useBetSlip } from "@/components/sportsbook/bet-slip-context";
import { Button } from "@/components/ui/button";

function remainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
}

export function BetSlip({
  balanceMkb,
  seasonId,
}: {
  balanceMkb: number;
  seasonId: string;
}) {
  const betSlip = useBetSlip();
  const [stake, setStake] = useState("10");
  const [stakeRevision, setStakeRevision] = useState(0);
  const [quote, setQuote] = useState<BetQuoteResult | null>(null);
  const [quoteBasis, setQuoteBasis] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [changedFromOdds, setChangedFromOdds] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [displayedBalance, setDisplayedBalance] = useState(balanceMkb);
  const [isPending, startTransition] = useTransition();
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

  useEffect(() => {
    if (!activeQuote) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(remainingSeconds(activeQuote.expiresAt));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [activeQuote]);

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
        setFeedback(result.message);
        return;
      }
      setQuote(result.quote);
      setQuoteBasis(currentBasis);
      setSecondsLeft(remainingSeconds(result.quote.expiresAt));
      setFeedback(
        "Devis confirmé par MK Bet. Vérifie les cotes avant de placer.",
      );
    });
  };

  const placeTicket = () => {
    if (!activeQuote || secondsLeft <= 0 || isPending) return;
    startTransition(async () => {
      const result = await placeBetAction({
        quoteId: activeQuote.quoteId,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!result.ok) {
        setFeedback(result.message);
        if (result.code === "ODDS_CHANGED" || result.code === "QUOTE_EXPIRED") {
          if (result.code === "ODDS_CHANGED")
            setChangedFromOdds(activeQuote.totalOdds);
          setQuote(null);
          setQuoteBasis("");
          setSecondsLeft(0);
        }
        return;
      }
      setDisplayedBalance(result.bet.balanceMkb);
      setTicketNumber(result.bet.ticketNumber);
      setFeedback("Pronostic enregistré. Ta dignité est désormais engagée.");
      setQuote(null);
      setQuoteBasis("");
      setChangedFromOdds(null);
      setSecondsLeft(0);
      betSlip.clearSelections();
    });
  };

  return (
    <aside
      aria-label="Ticket de pari"
      className="mk-glass-subtle rounded-2xl p-4"
      data-ticket-step={ticketStep}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.12em] text-[var(--brand)] uppercase">
            Ticket
          </p>
          <h2 className="text-lg font-black">
            {betSlip.selections.length} sélection
            {betSlip.selections.length > 1 ? "s" : ""}
          </h2>
        </div>
        <button
          className="min-h-11 rounded-md px-2 text-xs font-bold text-[var(--text-muted)] underline-offset-4 hover:bg-white/[0.07] hover:text-white hover:underline"
          onClick={betSlip.clearSelections}
          type="button"
        >
          Vider
        </button>
      </div>

      <p aria-live="polite" className="sr-only" role="status">
        {feedback || betSlip.message}
      </p>
      {feedback || betSlip.message ? (
        <p className="mt-3 rounded-lg bg-white/[0.07] p-2 text-sm text-[var(--text-secondary)]">
          {feedback || betSlip.message}
        </p>
      ) : null}

      {ticketNumber ? (
        <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Ticket #{ticketNumber}.{" "}
          <Link className="underline" href="/bets">
            Voir mes paris
          </Link>
        </p>
      ) : null}

      {betSlip.selections.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
          Tes amis prennent peut-être de mauvaises décisions pendant que ton
          ticket reste vide.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {betSlip.selections.map((selection) => (
            <BetSlipSelectionItem
              key={`${selection.marketId}:${selection.outcomeId}`}
              selection={selection}
            />
          ))}
        </ol>
      )}

      <div className="mt-4 space-y-2">
        <label className="text-sm font-bold" htmlFor="stake-mkb">
          Mise en MKB
        </label>
        <input
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-white/[0.07] px-3 text-base text-white tabular-nums"
          id="stake-mkb"
          inputMode="numeric"
          min={5}
          max={displayedBalance}
          onChange={(event) => {
            setStake(event.target.value);
            setStakeRevision((revision) => revision + 1);
          }}
          type="number"
          value={stake}
        />
        {!stakeValid ? (
          <p className="text-sm text-[var(--negative)]">
            {stakeNumber < 5
              ? "Mise minimale : 5 MKB."
              : `Solde disponible : ${displayedBalance} MKB.`}
          </p>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Cote définitive</dt>
          <dd className="font-black">
            {activeQuote
              ? activeQuote.totalOdds.toFixed(2).replace(".", ",")
              : "À vérifier"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Retour potentiel</dt>
          <dd className="font-black">
            {activeQuote ? `${activeQuote.potentialReturnMkb} MKB` : "—"}
          </dd>
        </div>
      </dl>

      {activeQuote?.correlationAdjustment ? (
        <p className="mt-3 text-xs text-[var(--warning)]">
          Combiné corrélé : coefficient{" "}
          {activeQuote.correlationAdjustment.toFixed(2)} appliqué aux
          probabilités.
        </p>
      ) : null}
      {changedFromOdds !== null && activeQuote ? (
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          Ancienne cote {changedFromOdds.toFixed(2)} · nouvelle cote{" "}
          {activeQuote.totalOdds.toFixed(2)} · nouveau retour{" "}
          {activeQuote.potentialReturnMkb} MKB. Une nouvelle confirmation est
          obligatoire.
        </p>
      ) : null}
      {activeQuote ? (
        <p className="mt-3 text-center text-sm font-bold" aria-live="polite">
          Devis valable encore {secondsLeft} s
        </p>
      ) : null}

      {activeQuote ? (
        secondsLeft > 0 ? (
          <Button
            className="mt-4 w-full"
            disabled={isPending}
            onClick={placeTicket}
            type="button"
          >
            {isPending ? "ENREGISTREMENT…" : "PLACER MON PRONOSTIC"}
          </Button>
        ) : (
          <Button
            className="mt-4 w-full"
            disabled={isPending}
            onClick={verifyTicket}
            type="button"
          >
            ACTUALISER LES COTES
          </Button>
        )
      ) : (
        <Button
          className="mt-4 w-full"
          disabled={isPending || !stakeValid || betSlip.selections.length === 0}
          onClick={verifyTicket}
          type="button"
        >
          {isPending
            ? "VÉRIFICATION…"
            : feedback.includes("évolué")
              ? "ACCEPTER LES NOUVELLES COTES"
              : "VÉRIFIER LE TICKET"}
        </Button>
      )}
      <details className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
        <summary className="cursor-pointer font-bold">
          Comment le ticket est sécurisé
        </summary>
        <p className="mt-2">
          Le navigateur envoie seulement les issues, la mise et une clé
          d’idempotence. PostgreSQL fixe les cotes et débite atomiquement les
          MKB fictifs.
        </p>
      </details>
    </aside>
  );
}
