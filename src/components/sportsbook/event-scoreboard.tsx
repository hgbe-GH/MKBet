import type { SportsbookLive } from "@/fixtures/sportsbook/types";

export function EventScoreboard({ live }: { live: SportsbookLive }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--brand-active)] p-5 text-white">
      <p className="text-xs font-black tracking-[0.12em] text-red-200 uppercase">
        Tableau de match
      </p>
      <h2 className="mt-2 text-2xl font-black">{live.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <p>
          <span className="block text-xs text-red-200">Statut</span>
          <span className="font-black">{live.status}</span>
        </p>
        <p>
          <span className="block text-xs text-red-200">Marchés live</span>
          <span className="font-black">{live.marketCount}</span>
        </p>
        <p>
          <span className="block text-xs text-red-200">Hôte</span>
          <span className="font-black">{live.host}</span>
        </p>
      </div>
    </section>
  );
}
