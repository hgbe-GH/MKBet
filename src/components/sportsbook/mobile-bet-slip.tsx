"use client";

import { useEffect, useRef, useState } from "react";

import { BetSlip } from "@/components/sportsbook/bet-slip";
import { useBetSlip } from "@/components/sportsbook/bet-slip-context";

export function MobileBetSlip({
  balanceMkb,
  seasonId,
}: {
  balanceMkb: number;
  seasonId: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const betSlip = useBetSlip();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-30 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_18px_50px_rgba(0,0,0,0.42)] lg:right-3 lg:left-3 xl:hidden">
      <button
        aria-controls="mobile-bet-slip-panel"
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span>{open ? "Fermer le ticket" : "Ouvrir le ticket"}</span>
        <span className="rounded-md bg-[var(--brand)] px-2 py-1 text-xs text-[var(--on-brand)] tabular-nums">
          {betSlip.selections.length}
        </span>
      </button>
      {open ? (
        <div
          className="max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain border-t border-[var(--border)]"
          data-motion="ticket"
          id="mobile-bet-slip-panel"
        >
          <BetSlip
            balanceMkb={balanceMkb}
            seasonId={seasonId}
            surface="opaque"
          />
        </div>
      ) : null}
    </div>
  );
}
