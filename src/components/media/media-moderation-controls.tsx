"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { moderateMediaAction } from "@/application/media/actions";
import { Button } from "@/components/ui/button";

type MediaModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
type ModerationTarget = "APPROVED" | "REJECTED" | "ARCHIVED";

const labels: Record<ModerationTarget, string> = {
  APPROVED: "APPROUVER",
  ARCHIVED: "ARCHIVER",
  REJECTED: "REJETER",
};

export function MediaModerationControls({
  mediaId,
  status,
}: {
  mediaId: string;
  status: MediaModerationStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const targets: ModerationTarget[] =
    status === "PENDING"
      ? ["APPROVED", "REJECTED"]
      : status === "APPROVED"
        ? ["ARCHIVED"]
        : [];

  function moderate(target: ModerationTarget) {
    setMessage(null);
    startTransition(async () => {
      try {
        await moderateMediaAction(mediaId, target);
        router.refresh();
      } catch {
        setMessage("La mise à jour du média a échoué.");
      }
    });
  }

  if (targets.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {targets.map((target) => (
        <Button
          disabled={isPending}
          key={target}
          onClick={() => moderate(target)}
          type="button"
          variant={target === "APPROVED" ? "default" : "outline"}
        >
          {labels[target]}
        </Button>
      ))}
      {message ? (
        <p aria-live="polite" className="w-full text-sm text-[var(--negative)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
