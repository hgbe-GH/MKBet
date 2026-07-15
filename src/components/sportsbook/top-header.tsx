import Link from "next/link";

import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

export function TopHeader({ season }: { season: SportsbookSeasonContext }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-lg font-black tracking-[-0.04em] lg:hidden"
            href="/direct"
          >
            MK <span className="text-[var(--brand)]">BET</span>
          </Link>
          <p className="hidden text-xs font-black text-[var(--brand)] lg:block">
            Salle Margot × Kévin
          </p>
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            {season.balanceMkb.toLocaleString("fr-FR")} MKB disponibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="hidden min-h-11 items-center rounded-md px-3 py-2 text-sm font-bold hover:bg-stone-100 sm:inline-flex"
            href="/settings/account"
          >
            Compte
          </Link>
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
