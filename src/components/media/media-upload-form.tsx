"use client";
import { useActionState, useSyncExternalStore } from "react";
import {
  uploadSeasonMediaAction,
  type MediaActionState,
} from "@/application/media/actions";
import { Button } from "@/components/ui/button";
const initialState: MediaActionState = { ok: false, message: "" };
const subscribeToNothing = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export function MediaUploadForm({ seasonId }: { seasonId: string }) {
  const [state, action, pending] = useActionState(
    uploadSeasonMediaAction,
    initialState,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    getHydratedSnapshot,
    getServerSnapshot,
  );

  return (
    <form
      action={action}
      className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-5"
      data-testid="season-media-upload-form"
      data-upload-ready={isHydrated}
    >
      <input name="seasonId" type="hidden" value={seasonId} />
      <label className="text-sm font-bold">
        Image{" "}
        <input
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full text-sm"
          name="file"
          required
          type="file"
        />
      </label>
      <label className="text-sm font-bold">
        Légende{" "}
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          maxLength={500}
          name="caption"
        />
      </label>
      <p className="text-xs text-[var(--text-muted)]">
        JPEG, PNG ou WebP, 10 Mo maximum. L’image est normalisée en WebP sans
        métadonnées.
      </p>
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
      <Button disabled={!isHydrated || pending} type="submit">
        {pending ? "ENVOI…" : "ENVOYER POUR VALIDATION"}
      </Button>
    </form>
  );
}
