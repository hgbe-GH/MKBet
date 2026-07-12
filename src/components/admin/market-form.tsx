"use client";

import { useActionState } from "react";

import {
  openTemplateMarketAction,
  type MarketActionState,
} from "@/application/markets/admin-actions";
import { Button } from "@/components/ui/button";

const initialState: MarketActionState = { ok: false, message: "" };

export function MarketForm({
  seasonId,
  templates,
  defaultDates,
}: {
  seasonId: string;
  templates: Array<{ code: string; title: string }>;
  defaultDates: { opensAt: string; closesAt: string; deadlineAt: string };
}) {
  const [state, action, pending] = useActionState(
    openTemplateMarketAction,
    initialState,
  );
  const opens = defaultDates.opensAt.slice(0, 16);
  const closes = defaultDates.closesAt.slice(0, 16);
  const deadline = defaultDates.deadlineAt.slice(0, 16);
  return (
    <form
      action={action}
      className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-5 md:grid-cols-2"
    >
      <input name="seasonId" type="hidden" value={seasonId} />
      <label className="text-sm font-bold md:col-span-2">
        Template
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="templateCode"
          required
        >
          {templates.map((template) => (
            <option key={template.code} value={template.code}>
              {template.code} — {template.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Ouverture
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          defaultValue={opens}
          name="opensAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="text-sm font-bold">
        Clôture
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          defaultValue={closes}
          name="closesAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="text-sm font-bold md:col-span-2">
        Échéance
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          defaultValue={deadline}
          name="deadlineAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="text-sm font-bold">
        Titre facultatif
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="titleOverride"
        />
      </label>
      <label className="text-sm font-bold">
        Titre trash facultatif
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="trashTitleOverride"
        />
      </label>
      <label className="text-sm font-bold md:col-span-2">
        Description
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] p-3"
          name="description"
        />
      </label>
      <p
        aria-live="polite"
        className={
          state.ok
            ? "text-sm text-[var(--positive)]"
            : "text-sm text-[var(--negative)]"
        }
      >
        {state.message}
      </p>
      <Button className="md:col-start-2" disabled={pending} type="submit">
        {pending ? "CRÉATION…" : "CRÉER LE MARCHÉ"}
      </Button>
      <p className="text-xs text-[var(--text-muted)] md:col-span-2">
        Les paramètres q, demi-vie, marge, probabilités et cotes proviennent
        exclusivement du template PostgreSQL.
      </p>
    </form>
  );
}
