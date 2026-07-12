import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <li className="relative border-l-2 border-[var(--brand-muted)] pb-6 pl-5">
      <span
        aria-hidden="true"
        className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--brand)]"
      />
      <p className="text-xs font-black tracking-[0.1em] text-[var(--text-muted)] uppercase">
        {event.category} · {new Date(event.occurredAt).toLocaleString("fr-FR")}
      </p>
      <h2 className="mt-1 text-lg font-black">{event.title}</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
        {event.classified ? "Contenu classifié." : event.description}
      </p>
    </li>
  );
}
