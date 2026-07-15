import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mk-glass-subtle rounded-2xl border-dashed p-8 text-center">
      <Inbox
        aria-hidden="true"
        className="mx-auto h-8 w-8 text-[var(--text-muted)]"
      />
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </section>
  );
}
