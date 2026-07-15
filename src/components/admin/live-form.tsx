"use client";

import { useActionState, useState } from "react";

import {
  createLiveSessionAction,
  type LiveActionState,
} from "@/application/lives/actions";
import type { LiveMemberOption } from "@/data/supabase/lives/repository";

import { Button } from "@/components/ui/button";

const initialState: LiveActionState = { ok: false, message: "" };

type AttendeeRole = "REPORTER" | "VIEWER";

export function LiveForm({
  seasonId,
  members,
  currentUserId,
  canAssignHost,
}: {
  seasonId: string;
  members: LiveMemberOption[];
  currentUserId: string;
  canAssignHost: boolean;
}) {
  const hostMembers = members.filter((member) =>
    member.roles.includes("LIVE_HOST"),
  );
  const defaultHost = canAssignHost
    ? (hostMembers[0]?.userId ?? "")
    : currentUserId;
  const [liveType, setLiveType] = useState<
    "PROGRAMMED" | "INSTANT" | "TIME_WINDOW"
  >("PROGRAMMED");
  const [hostUserId, setHostUserId] = useState(defaultHost);
  const [attendeeRoles, setAttendeeRoles] = useState<
    Record<string, AttendeeRole>
  >({});
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(
    createLiveSessionAction,
    initialState,
  );
  const requiresSchedule =
    liveType === "PROGRAMMED" || liveType === "TIME_WINDOW";

  function changeHost(nextHostUserId: string) {
    setHostUserId(nextHostUserId);
    setAttendeeRoles((current) => {
      const next = { ...current };
      delete next[nextHostUserId];
      return next;
    });
  }

  function toggleAttendee(userId: string, checked: boolean) {
    setAttendeeRoles((current) => {
      if (!checked) {
        const next = { ...current };
        delete next[userId];
        return next;
      }
      return { ...current, [userId]: "VIEWER" };
    });
  }

  return (
    <form
      action={action}
      className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-5 md:grid-cols-2"
    >
      <input name="seasonId" type="hidden" value={seasonId} />
      <input name="hostUserId" type="hidden" value={hostUserId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <label className="text-sm font-bold md:col-span-2">
        Titre
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          maxLength={160}
          name="title"
          required
        />
      </label>
      <label className="text-sm font-bold">
        Type de live
        <select
          aria-label="Type de live"
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="liveType"
          onChange={(event) =>
            setLiveType(
              event.target.value as "PROGRAMMED" | "INSTANT" | "TIME_WINDOW",
            )
          }
          value={liveType}
        >
          <option value="PROGRAMMED">Programmé</option>
          <option value="TIME_WINDOW">Fenêtre temporelle</option>
          <option value="INSTANT">Instantané</option>
        </select>
      </label>
      {canAssignHost ? (
        <label className="text-sm font-bold">
          Hôte
          <select
            aria-label="Hôte"
            className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
            onChange={(event) => changeHost(event.target.value)}
            value={hostUserId}
          >
            {hostMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="self-end text-sm text-[var(--text-secondary)]">
          Hôte : toi-même. Un hôte est ajouté automatiquement.
        </p>
      )}
      <label className="text-sm font-bold">
        Début planifié (UTC)
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="scheduledStart"
          required={requiresSchedule}
          type="datetime-local"
        />
      </label>
      <label className="text-sm font-bold">
        Fin planifiée (UTC)
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          name="scheduledEnd"
          required={requiresSchedule}
          type="datetime-local"
        />
      </label>
      <p className="text-xs text-[var(--text-muted)] md:col-span-2">
        {requiresSchedule
          ? "Le planning est obligatoire pour ce type de live."
          : "Planning indicatif facultatif pour un live instantané."}
      </p>
      <label className="text-sm font-bold">
        Lieu facultatif
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
          maxLength={160}
          name="locationLabel"
        />
      </label>
      <label className="text-sm font-bold">
        Description facultative
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] p-3"
          maxLength={1000}
          name="description"
        />
      </label>
      <fieldset className="rounded-md border border-[var(--border)] p-4 md:col-span-2">
        <legend className="px-1 text-sm font-black">Participants</legend>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          L’hôte est ajouté automatiquement avec le rôle HOST.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {members
            .filter((member) => member.userId !== hostUserId)
            .map((member) => {
              const selectedRole = attendeeRoles[member.userId];
              return (
                <div
                  className="flex min-h-11 items-center gap-2 rounded-md bg-stone-50 p-2"
                  key={member.userId}
                >
                  <input
                    aria-label={`Participant ${member.displayName}`}
                    checked={Boolean(selectedRole)}
                    id={`participant-${member.userId}`}
                    name="attendeeUserId"
                    onChange={(event) =>
                      toggleAttendee(member.userId, event.target.checked)
                    }
                    type="checkbox"
                    value={member.userId}
                  />
                  <label
                    className="min-w-0 flex-1 text-sm font-bold"
                    htmlFor={`participant-${member.userId}`}
                  >
                    {member.displayName}
                  </label>
                  <select
                    aria-label={`Rôle ${member.displayName}`}
                    disabled={!selectedRole}
                    name={`attendeeRole:${member.userId}`}
                    onChange={(event) =>
                      setAttendeeRoles((current) => ({
                        ...current,
                        [member.userId]: event.target.value as AttendeeRole,
                      }))
                    }
                    value={selectedRole ?? "VIEWER"}
                  >
                    <option value="VIEWER">Observateur</option>
                    <option value="REPORTER">Reporter</option>
                  </select>
                </div>
              );
            })}
        </div>
      </fieldset>
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
        {pending ? "CRÉATION…" : "CRÉER LE LIVE"}
      </Button>
    </form>
  );
}
