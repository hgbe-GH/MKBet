import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--negative)]/35 bg-[var(--negative)]/10 p-6">
      <AlertTriangle
        aria-hidden="true"
        className="h-6 w-6 text-[var(--negative)]"
      />
      <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#ffc3c8]">{description}</p>
    </section>
  );
}
