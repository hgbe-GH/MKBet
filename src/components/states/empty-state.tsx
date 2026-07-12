import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center">
      <Inbox aria-hidden="true" className="mx-auto h-8 w-8 text-stone-400" />
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </section>
  );
}
