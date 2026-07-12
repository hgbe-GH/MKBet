import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUserDashboardSeason } from "@/data/supabase/seasons/repository";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const seasonParam = params?.season;
  const seasonId = typeof seasonParam === "string" ? seasonParam : null;
  const season = await getCurrentUserDashboardSeason(seasonId);

  if (!season) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-black">Aucune saison sélectionnée</h1>
        <Button asChild>
          <Link href="/seasons">Choisir une saison</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black tracking-[0.14em] text-red-800 uppercase">
          Tableau de bord
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
          {season.title}
        </h1>
      </div>
      <section className="grid gap-4 rounded-md border border-stone-200 bg-white p-6 sm:grid-cols-2">
        <p>
          <span className="block text-sm font-bold text-stone-500">
            Date de rupture
          </span>
          {season.breakupDate}
        </p>
        <p>
          <span className="block text-sm font-bold text-stone-500">Rôles</span>
          {season.roles.join(", ")}
        </p>
        <p>
          <span className="block text-sm font-bold text-stone-500">
            Capital MKB
          </span>
          {season.balanceMkb ?? "non initialisé"}
        </p>
        <p>
          <span className="block text-sm font-bold text-stone-500">État</span>
          Authentification et permissions opérationnelles
        </p>
      </section>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/seasons">Saisons</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings/account">Compte</Link>
        </Button>
      </div>
    </div>
  );
}
