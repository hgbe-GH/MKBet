"use client";

import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { useToast } from "@astryxdesign/core/Toast";
import { useState, useTransition } from "react";

import { voteEventReportAction } from "@/application/events/actions";
import type { EventVoteDecision } from "@/domain/events/types";

export function EventVoteControls({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [pendingDecision, setPendingDecision] =
    useState<EventVoteDecision | null>(null);
  const [submittedDecision, setSubmittedDecision] =
    useState<EventVoteDecision | null>(null);
  const toast = useToast();

  const vote = (decision: EventVoteDecision) => {
    startTransition(async () => {
      const result = await voteEventReportAction(reportId, decision);
      setMessage(result.message);
      toast({
        body: result.message,
        type: result.ok ? "info" : "error",
        uniqueID: `event-vote-${reportId}`,
      });
      if (result.ok) setSubmittedDecision(decision);
    });
  };

  if (submittedDecision) {
    return (
      <p aria-live="polite" className="text-sm font-semibold">
        Ton vote :{" "}
        {submittedDecision === "CONFIRM" ? "validation" : "invalidation"}.
      </p>
    );
  }

  const dialogTitle =
    pendingDecision === "CONFIRM" ? "Valider ce fait ?" : "Invalider ce fait ?";

  return (
    <div className="border-t border-[var(--color-border)] pt-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          isDisabled={isPending}
          label="Valider ce fait"
          onClick={() => setPendingDecision("CONFIRM")}
          variant="primary"
          width="100%"
        />
        <Button
          isDisabled={isPending}
          label="Invalider ce fait"
          onClick={() => setPendingDecision("REJECT")}
          variant="secondary"
          width="100%"
        />
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm">
        {message}
      </p>
      <AlertDialog
        actionLabel="Confirmer"
        actionVariant={pendingDecision === "REJECT" ? "destructive" : "primary"}
        cancelLabel="Annuler"
        description="Ton choix est définitif et comptera dans la décision du groupe."
        isActionLoading={isPending}
        isOpen={pendingDecision !== null}
        onAction={() => {
          if (!pendingDecision) return;
          const decision = pendingDecision;
          setPendingDecision(null);
          vote(decision);
        }}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingDecision(null);
        }}
        title={dialogTitle}
      />
    </div>
  );
}
