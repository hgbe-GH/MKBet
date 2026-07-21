import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { PageHeading } from "@/components/astryx/page-heading";
import { CategoryTabs } from "@/components/sportsbook/category-tabs";
import { MarketGroup } from "@/components/sportsbook/market-group";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";

export const dynamic = "force-dynamic";

interface MarketsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketsPage({ searchParams }: MarketsPageProps) {
  const rawParams = (await searchParams) ?? {};
  const filters = parseMarketSearchParams(rawParams);
  const season = await requireSportsbookSeason();
  const markets = await listSeasonMarkets(season.id, filters);

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Marchés réels"
        title="Tableau des cotes"
        description={`Cotes officielles de ${season.title}. Vérifie ton devis avant de confirmer.`}
      />
      <CategoryTabs
        activeCategory={filters.category}
        q={filters.q}
        sort={filters.sort}
        status={filters.status}
      />
      <form
        action="/markets"
        className="mk-glass-subtle grid gap-3 rounded-2xl p-4 md:grid-cols-4"
      >
        <input name="category" type="hidden" value={filters.category} />
        <label className="text-sm font-bold md:col-span-2">
          Rechercher
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border)] bg-white/[0.07] px-3 text-white"
            defaultValue={filters.q}
            name="q"
            placeholder="bisou, statut…"
          />
        </label>
        <label className="text-sm font-bold">
          Statut
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-white"
            defaultValue={filters.status}
            name="status"
          >
            <option value="ALL">Tous</option>
            <option value="OPEN">Ouverts</option>
            <option value="SUSPENDED">Suspendus</option>
            <option value="CLOSED">Clos</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Tri
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-white"
            defaultValue={filters.sort}
            name="sort"
          >
            <option value="popular">Par défaut</option>
            <option value="deadline">Échéance</option>
            <option value="odds">Cote</option>
            <option value="movement">Version</option>
          </select>
        </label>
        <button className="mk-primary-action md:col-start-4" type="submit">
          Filtrer
        </button>
      </form>
      <MarketGroup
        emptyDescription="Aucun marché ouvert. Le comité doit encore publier les premières cotes."
        markets={markets}
        title="Cotes disponibles"
      />
    </div>
  );
}
