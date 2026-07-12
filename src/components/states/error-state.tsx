import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <AlertTriangle aria-hidden="true" className="h-6 w-6 text-red-700" />
      <h2 className="mt-3 text-xl font-black text-red-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-900">{description}</p>
    </section>
  );
}
