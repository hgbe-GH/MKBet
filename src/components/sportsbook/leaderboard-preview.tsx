import type { LeaderboardRow } from "@/fixtures/sportsbook/types";

export function LeaderboardPreview({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="text-xl font-black">Podium</h2>
      <ol className="mt-3 grid gap-3">
        {rows.slice(0, 3).map((row) => (
          <li
            className="flex items-center justify-between rounded-md bg-stone-50 p-3"
            key={row.playerName}
          >
            <span className="font-black">
              #{row.rank} {row.playerName}
            </span>
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              {row.capitalMkb} MKB
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
