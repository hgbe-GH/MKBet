"use client";

import { useMemo, useState } from "react";

import { BetSlipSelectionItem } from "@/components/sportsbook/bet-slip-selection";
import { Button } from "@/components/ui/button";
import { useBetSlip } from "@/components/sportsbook/bet-slip-context";

export function BetSlip({ balanceMkb }: { balanceMkb: number }) {
  const betSlip = useBetSlip();
  const [stake, setStake] = useState("10");
  const stakeNumber = Number(stake);
  const stakeValid =
    Number.isInteger(stakeNumber) &&
    Number.isFinite(stakeNumber) &&
    stakeNumber >= 5 &&
    stakeNumber <= balanceMkb;

  const totalOdds = useMemo(() => {
    if (betSlip.selections.length === 0) {
      return null;
    }
    if (betSlip.selections.length > 1) {
      return null;
    }
    return betSlip.selections[0].odds;
  }, [betSlip.selections]);

  const potentialReturn =
    totalOdds && stakeValid ? Math.floor(stakeNumber * totalOdds) : null;

  return (
    <aside
      aria-label="Ticket de pari visuel"
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[0_12px_35px_rgba(28,25,23,0.08)]"
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
          className="text-xs font-bold text-[var(--text-muted)] underline-offset-4 hover:underline"
          onClick={betSlip.clearSelections}
          type="button"
        >
          Vider
        </button>
      </div>

      <p className="sr-only" role="status">
        {betSlip.message}
      </p>
      {betSlip.message ? (
        <p className="mt-3 rounded-md bg-stone-100 p-2 text-sm text-[var(--text-secondary)]">
          {betSlip.message}
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
          className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-base tabular-nums"
          id="stake-mkb"
          inputMode="numeric"
          min={5}
          max={balanceMkb}
          onChange={(event) => setStake(event.target.value)}
          type="number"
          value={stake}
        />
        {!stakeValid ? (
          <p className="text-sm text-[var(--negative)]">
            {stakeNumber < 5
              ? "Mise minimale : 5 MKB."
              : `Mise maximale affichée : ${balanceMkb} MKB.`}
          </p>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Cote finale</dt>
          <dd className="font-black">
            {totalOdds
              ? totalOdds.toFixed(2).replace(".", ",")
              : "Calculée lors de la validation"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Retour potentiel</dt>
          <dd className="font-black">
            {potentialReturn ? `${potentialReturn} MKB` : "—"}
          </dd>
        </div>
      </dl>

      <Button className="mt-4 w-full" disabled type="button">
        PLACEMENT DISPONIBLE À L’ÉTAPE SUIVANTE
      </Button>
      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
        Ticket visuel uniquement : aucun débit, aucun pari réel, aucun
        règlement.
      </p>
    </aside>
  );
}
