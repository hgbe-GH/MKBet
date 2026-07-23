import { Badge } from "@astryxdesign/core/Badge";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

import type { OddsMovement as OddsMovementValue } from "@/fixtures/sportsbook/types";

export function OddsMovement({ movement }: { movement: OddsMovementValue }) {
  if (movement === "UP") {
    return (
      <Badge
        icon={<ArrowUp aria-hidden="true" className="h-3 w-3" />}
        label="En hausse"
        variant="success"
      />
    );
  }
  if (movement === "DOWN") {
    return (
      <Badge
        icon={<ArrowDown aria-hidden="true" className="h-3 w-3" />}
        label="En baisse"
        variant="error"
      />
    );
  }
  return (
    <Badge
      icon={<ArrowRight aria-hidden="true" className="h-3 w-3" />}
      label="Stable"
      variant="neutral"
    />
  );
}
