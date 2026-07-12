import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
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
  const season = await requireSportsbookSeason(
    typeof rawParams.season === "string" ? rawParams.season : null,
  );
  const markets = await listSeasonMarkets(season.id, filters);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Marchés réels
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Tableau des cotes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Cotes officielles de {season.title}. Chaque confirmation crée d’abord
          un devis autoritaire de 60 secondes.
        </p>
      </header>
      <CategoryTabs
        activeCategory={filters.category}
        q={filters.q}
        sort={filters.sort}
        status={filters.status}
      />
      <form
        action="/markets"
        className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 md:grid-cols-4"
      >
        <input name="category" type="hidden" value={filters.category} />
        <label className="text-sm font-bold md:col-span-2">
          Rechercher
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
            defaultValue={filters.q}
            name="q"
            placeholder="bisou, statut..."
          />
        </label>
        <label className="text-sm font-bold">
          Statut
          <select
            className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
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
            className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] px-3"
            defaultValue={filters.sort}
            name="sort"
          >
            <option value="popular">Par défaut</option>
            <option value="deadline">Échéance</option>
            <option value="odds">Cote</option>
            <option value="movement">Version</option>
          </select>
        </label>
        <button
          className="min-h-11 rounded-md bg-[var(--brand)] px-4 text-sm font-black text-white md:col-start-4"
          type="submit"
        >
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
