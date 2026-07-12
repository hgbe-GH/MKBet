import { ActivityFeedItem } from "@/components/sportsbook/activity-feed-item";
import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export function ActivityFeed({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="text-xl font-black">Dernières actions</h2>
      <ol className="mt-3">
        {events.map((event) => (
          <ActivityFeedItem event={event} key={event.id} />
        ))}
      </ol>
    </section>
  );
}
