"use client";

import { useMemo, useActionState } from "react";

import type { SeasonFormState } from "@/application/seasons/actions";
import { Button } from "@/components/ui/button";

interface NewSeasonFormProps {
  action: (
    previousState: SeasonFormState,
    formData: FormData,
  ) => Promise<SeasonFormState>;
}

const initialState: SeasonFormState = { ok: true, message: "" };

export function NewSeasonForm({ action }: NewSeasonFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const nowIso = useMemo(() => new Date().toISOString(), []);

  return (
    <form action={formAction} className="grid gap-5">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <input name="startedAt" type="hidden" value={nowIso} />
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="title">
          Titre
        </label>
        <input
          className="min-h-12 w-full rounded-md border border-stone-300 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          id="title"
          name="title"
          required
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="breakupDate">
          Date de rupture
        </label>
        <input
          className="min-h-12 w-full rounded-md border border-stone-300 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          id="breakupDate"
          name="breakupDate"
          required
          type="date"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="description">
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-md border border-stone-300 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          id="description"
          name="description"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="startingBalanceMkb">
          Capital initial MKB
        </label>
        <input
          className="min-h-12 w-full rounded-md border border-stone-300 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          defaultValue="1000"
          id="startingBalanceMkb"
          min="0"
          name="startingBalanceMkb"
          required
          type="number"
        />
      </div>
      <label className="flex items-center gap-3 text-sm font-bold">
        <input
          className="h-5 w-5 accent-red-900"
          name="secretBetsUntilClose"
          type="checkbox"
        />
        Paris secrets avant clôture
      </label>
      <Button disabled={pending} type="submit">
        {pending ? "Création" : "Créer la saison"}
      </Button>
      {state.message ? (
        <p className="text-sm text-stone-600">{state.message}</p>
      ) : null}
    </form>
  );
}
