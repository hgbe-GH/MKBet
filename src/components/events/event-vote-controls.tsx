"use client";

import { useState, useTransition } from "react";

import { voteEventReportAction } from "@/application/events/actions";
import type { EventVoteDecision } from "@/domain/events/types";

export function EventVoteControls({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [submittedDecision, setSubmittedDecision] =
    useState<EventVoteDecision | null>(null);

  const vote = (decision: EventVoteDecision) => {
    startTransition(async () => {
      const result = await voteEventReportAction(reportId, decision);
      setMessage(result.message);
      if (result.ok) setSubmittedDecision(decision);
    });
  };

  if (submittedDecision) {
    return (
      <p
        aria-live="polite"
        className="mt-4 text-sm font-semibold text-[var(--text-secondary)]"
      >
        Ton vote :{" "}
        {submittedDecision === "CONFIRM" ? "validation" : "invalidation"}.
      </p>
    );
  }

  return (
    <div className="mt-5 border-t border-[var(--border)] pt-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="min-h-11 rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-black text-white transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          onClick={() => vote("CONFIRM")}
          type="button"
        >
          Valider
        </button>
        <button
          className="min-h-11 rounded-md border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm font-black text-[var(--text-primary)] transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          onClick={() => vote("REJECT")}
          type="button"
        >
          Invalider
        </button>
      </div>
      <p
        aria-live="polite"
        className="mt-2 min-h-5 text-sm text-[var(--text-secondary)]"
      >
        {message}
      </p>
    </div>
  );
}
