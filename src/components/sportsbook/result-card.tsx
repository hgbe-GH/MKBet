import { StatusBadge } from "@/components/sportsbook/status-badge";
import type { SportsbookResult } from "@/fixtures/sportsbook/types";

export function ResultCard({ result }: { result: SportsbookResult }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-5">
      <StatusBadge tone={result.status === "SETTLED" ? "positive" : "warning"}>
        {result.status}
      </StatusBadge>
      <h2 className="mt-3 text-xl font-black">{result.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {result.summary}
      </p>
      <p className="mt-2 text-xs font-bold text-[var(--text-muted)]">
        {new Date(result.resolvedAt).toLocaleString("fr-FR")}
      </p>
    </article>
  );
}
