import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SeasonSummary } from "@/application/seasons/types";

interface SeasonSelectorProps {
  seasons: SeasonSummary[];
}

export function SeasonSelector({ seasons }: SeasonSelectorProps) {
  if (seasons.length === 0) {
    return (
      <section className="space-y-5">
        <p className="rounded-md border border-stone-200 bg-white p-5 text-stone-700">
          Aucun championnat actif. Utilise une invitation ou crée une nouvelle
          saison.
        </p>
        <Button asChild>
          <Link href="/seasons/new">Créer une saison</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {seasons.map((season) => (
        <article
          className="rounded-md border border-stone-200 bg-white p-5"
          key={season.id}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-950">
                {season.title}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {season.roles.join(", ")} · {season.status}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Capital : {season.balanceMkb ?? "non initialisé"} MKB
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard?season=${season.id}`}>Entrer</Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}
