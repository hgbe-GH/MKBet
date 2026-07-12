import Link from "next/link";

import { SeasonSelector } from "@/components/seasons/season-selector";
import { Button } from "@/components/ui/button";
import { listCurrentUserSeasons } from "@/data/supabase/seasons/repository";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const seasons = await listCurrentUserSeasons();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.14em] text-red-800 uppercase">
            Saisons
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
            Championnats privés
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/seasons/new">Créer une saison</Link>
        </Button>
      </div>
      <SeasonSelector seasons={seasons} />
    </div>
  );
}
