import { Badge } from "@astryxdesign/core/Badge";
import { ListItem } from "@astryxdesign/core/List";

import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export function ActivityFeedItem({ event }: { event: TimelineEvent }) {
  const occurredAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(event.occurredAt));

  return (
    <ListItem
      description={
        <span>
          {event.classified ? "Information classifiée." : event.description}
          <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
            <time dateTime={event.occurredAt}>{occurredAt}</time>
          </span>
        </span>
      }
      endContent={<Badge label={event.status} variant="neutral" />}
      label={event.title}
    />
  );
}
