"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/VStack";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { useCallback, useMemo, useActionState, useState } from "react";

import type { SeasonFormState } from "@/application/seasons/actions";
import { AuthTextInput } from "@/components/auth/auth-text-input";

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
  const [title, setTitle] = useState("");
  const [breakupDate, setBreakupDate] = useState<ISODateString>();
  const [description, setDescription] = useState("");
  const [startingBalance, setStartingBalance] = useState(1000);
  const [secretBets, setSecretBets] = useState(false);
  const markAsRequired = useCallback((input: HTMLInputElement | null) => {
    if (input) input.required = true;
  }, []);
  const status = pending
    ? "pending"
    : state.message
      ? state.ok
        ? "success"
        : "error"
      : "idling";

  return (
    <form action={formAction} aria-busy={pending} data-status={status}>
      <VStack gap={5}>
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <input name="startedAt" type="hidden" value={nowIso} />
        <input name="breakupDate" type="hidden" value={breakupDate ?? ""} />
        <AuthTextInput
          htmlName="title"
          label="Titre"
          onChange={setTitle}
          required
          size="lg"
          type="text"
          value={title}
          width="100%"
        />
        <DateInput
          label="Date de rupture"
          onChange={setBreakupDate}
          placeholder="JJ/MM/AAAA"
          ref={markAsRequired}
          size="lg"
          value={breakupDate}
          width="100%"
        />
        <TextArea
          htmlName="description"
          label="Description"
          onChange={setDescription}
          rows={4}
          value={description}
          width="100%"
        />
        <NumberInput
          htmlName="startingBalanceMkb"
          isIntegerOnly
          label="Capital initial MKB"
          min={0}
          onChange={setStartingBalance}
          ref={markAsRequired}
          size="lg"
          units="MKB"
          value={startingBalance}
          width="100%"
        />
        <CheckboxInput
          htmlName="secretBetsUntilClose"
          label="Paris secrets avant clôture"
          onChange={setSecretBets}
          value={secretBets}
        />
        <Button
          isDisabled={pending}
          isLoading={pending}
          label="Créer la saison"
          size="lg"
          type="submit"
          variant="primary"
        />
        <span aria-live="polite" className="sr-only" role="status">
          {pending ? "Création de la saison en cours." : ""}
        </span>
        {state.message ? (
          <Banner
            status={state.ok ? "success" : "error"}
            title={state.message}
          />
        ) : null}
      </VStack>
    </form>
  );
}
