"use client";

import { useActionState, useState } from "react";

import { submitEventReportAction } from "@/application/events/actions";
import {
  EVENT_REPORT_LABELS,
  EVENT_REPORT_TYPES,
  type ReportableMarket,
} from "@/domain/events/types";

const initialState = { ok: false, message: "" };

export function EventReportForm({ markets }: { markets: ReportableMarket[] }) {
  const [state, action, isPending] = useActionState(
    submitEventReportAction,
    initialState,
  );
  const [marketId, setMarketId] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const selectedMarket = markets.find((market) => market.id === marketId);

  return (
    <form action={action} className="grid gap-5">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <input name="occurredAt" type="hidden" value={occurredAt} />

      <div className="grid gap-2">
        <label className="text-sm font-black" htmlFor="report-type">
          Type d’événement
        </label>
        <select
          className="min-h-12 rounded-md border border-[var(--border-strong)] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          id="report-type"
          name="reportType"
          required
        >
          {EVENT_REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EVENT_REPORT_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-black" htmlFor="occurred-at-local">
          Date et heure réelles
        </label>
        <input
          className="min-h-12 rounded-md border border-[var(--border-strong)] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          id="occurred-at-local"
          max={new Date().toISOString().slice(0, 16)}
          onChange={(event) =>
            setOccurredAt(
              event.currentTarget.value
                ? new Date(event.currentTarget.value).toISOString()
                : "",
            )
          }
          required
          type="datetime-local"
        />
        <p className="text-sm text-[var(--text-secondary)]">
          Saisis l’heure locale affichée sur ton appareil.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-black" htmlFor="report-note">
          Ce qui s’est passé
        </label>
        <textarea
          className="min-h-32 rounded-md border border-[var(--border-strong)] bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          id="report-note"
          maxLength={500}
          name="note"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-black" htmlFor="report-market">
          Marché concerné
        </label>
        <select
          className="min-h-12 rounded-md border border-[var(--border-strong)] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          id="report-market"
          name="marketId"
          onChange={(event) => setMarketId(event.currentTarget.value)}
          value={marketId}
        >
          <option value="">Aucun, événement informatif</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.title}
            </option>
          ))}
        </select>
      </div>

      {selectedMarket ? (
        <div className="grid gap-2">
          <label className="text-sm font-black" htmlFor="report-outcome">
            Issue observée
          </label>
          <select
            className="min-h-12 rounded-md border border-[var(--border-strong)] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            id="report-outcome"
            name="outcomeId"
            required
          >
            {selectedMarket.outcomes.map((outcome) => (
              <option key={outcome.id} value={outcome.id}>
                {outcome.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-black" htmlFor="report-files">
          Preuves privées
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="min-h-12 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand)] file:px-3 file:py-2 file:font-bold file:text-white"
          id="report-files"
          multiple
          name="files"
          type="file"
        />
        <p className="text-sm text-[var(--text-secondary)]">
          Jusqu’à cinq images, visibles uniquement par les comptes connectés.
        </p>
      </div>

      <button
        className="min-h-12 rounded-md bg-[var(--brand)] px-5 py-3 font-black text-white transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Envoi en cours" : "Envoyer au vote"}
      </button>
      <p
        aria-live="polite"
        className={state.ok ? "text-sm font-bold text-emerald-800" : "text-sm font-bold text-[var(--danger)]"}
      >
        {state.message}
      </p>
    </form>
  );
}
