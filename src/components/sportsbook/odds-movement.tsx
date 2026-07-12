import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

import type { OddsMovement as OddsMovementValue } from "@/fixtures/sportsbook/types";

export function OddsMovement({ movement }: { movement: OddsMovementValue }) {
  if (movement === "UP") {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--positive)]">
        <ArrowUp aria-hidden="true" className="h-3 w-3" /> En hausse
      </span>
    );
  }
  if (movement === "DOWN") {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--negative)]">
        <ArrowDown aria-hidden="true" className="h-3 w-3" /> En baisse
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
      <ArrowRight aria-hidden="true" className="h-3 w-3" /> Stable
    </span>
  );
}
