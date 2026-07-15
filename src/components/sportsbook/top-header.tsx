import Link from "next/link";

import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

export function TopHeader({ season }: { season: SportsbookSeasonContext }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-lg font-black tracking-[-0.04em] lg:hidden"
            href="/dashboard"
          >
            MK <span className="text-[var(--brand)]">BET</span>
          </Link>
          <p className="hidden text-xs font-black tracking-[0.12em] text-[var(--brand)] uppercase lg:block">
            Salle des marchés
          </p>
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            {season.matchup} · J+{season.daysSinceBreakup}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {season.isDemo ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[0.68rem] font-black tracking-[0.08em] text-amber-800 uppercase">
              Données de démonstration
            </span>
          ) : null}
          <form action="/logout" method="post">
            <button
              className="min-h-11 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-bold hover:bg-stone-100"
              type="submit"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
