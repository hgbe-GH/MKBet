import Link from "next/link";

import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

export function TopHeader({ season }: { season: SportsbookSeasonContext }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(8,8,11,0.72)] backdrop-blur-2xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-lg font-black tracking-[-0.04em] lg:hidden"
            href="/direct"
          >
            MK<span className="text-[var(--brand)]">BET</span>
          </Link>
          <p className="hidden text-[0.64rem] font-black tracking-[0.12em] text-[var(--brand-hover)] uppercase lg:block">
            Salle privée · 7 membres
          </p>
          <p className="text-sm font-black text-white tabular-nums">
            {season.balanceMkb.toLocaleString("fr-FR")} MKB disponibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="mk-glass-subtle hidden min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold hover:border-white/25 sm:inline-flex"
            href="/settings/account"
          >
            Compte
          </Link>
        </div>
      </div>
    </header>
  );
}
