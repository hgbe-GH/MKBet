import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export function ActivityFeedItem({ event }: { event: TimelineEvent }) {
  return (
    <li className="border-b border-[var(--border)] py-3 last:border-b-0">
      <p className="text-sm font-black">{event.title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {event.classified ? "Information classifiée." : event.description}
      </p>
      <p className="mt-1 text-xs font-bold text-[var(--text-muted)]">
        {new Date(event.occurredAt).toLocaleString("fr-FR")} · {event.status}
      </p>
    </li>
  );
}
