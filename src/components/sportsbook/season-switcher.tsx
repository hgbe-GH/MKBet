import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

interface SeasonSwitcherProps {
  currentSeason: SportsbookSeasonContext | null;
  seasons: SportsbookSeasonContext[];
}

export function SeasonSwitcher({
  currentSeason,
  seasons,
}: SeasonSwitcherProps) {
  if (!currentSeason) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-bold text-[var(--text-secondary)]">
          Aucun championnat sélectionné.
        </p>
        <Button asChild className="mt-3">
          <Link href="/seasons">CHOISIR UNE SAISON</Link>
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-label="Sélection de saison"
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <p className="text-[0.68rem] font-black tracking-[0.12em] text-[var(--text-muted)] uppercase">
        Championnat actif
      </p>
      <h2 className="mt-1 text-base font-black">{currentSeason.matchup}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {currentSeason.title} · {currentSeason.status}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {currentSeason.roles.map((role) => (
          <span
            className="rounded-full bg-red-50 px-2.5 py-1 text-[0.68rem] font-black text-[var(--brand)]"
            key={role}
          >
            {role}
          </span>
        ))}
      </div>
      {seasons.length > 1 ? (
        <label className="mt-3 block text-sm font-bold">
          Changer
          <select className="mt-1 min-h-10 w-full rounded-md border border-[var(--border)] bg-white px-2">
            {seasons.map((season) => (
              <option key={season.id}>{season.title}</option>
            ))}
          </select>
        </label>
      ) : null}
    </section>
  );
}
