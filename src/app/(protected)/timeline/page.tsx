import { TimelineItem } from "@/components/sportsbook/timeline-item";
import { listDemoTimeline } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

const filters = [
  "Tout",
  "Contact",
  "Physique",
  "Cul",
  "Relation",
  "Statut",
  "Conflits",
  "Lives",
];

export default async function TimelinePage() {
  const events = await listDemoTimeline();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Chronologie
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Journal de saison
        </h1>
      </header>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {filters.map((filter) => (
          <button
            className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-bold"
            disabled={filter !== "Tout"}
            key={filter}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>
      <ol className="rounded-lg border border-[var(--border)] bg-white p-5">
        {events.map((event) => (
          <TimelineItem event={event} key={event.id} />
        ))}
      </ol>
    </div>
  );
}
