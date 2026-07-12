import { CategoryTabs } from "@/components/sportsbook/category-tabs";
import { MarketGroup } from "@/components/sportsbook/market-group";
import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { demoMarketRepository } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

interface MarketsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketsPage({ searchParams }: MarketsPageProps) {
  const filters = parseMarketSearchParams((await searchParams) ?? {});
  const markets = await demoMarketRepository.listMarkets(filters);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Marchés
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Tableau des cotes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Données de démonstration. Le placement réel sera activé dans une étape
          future.
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
            placeholder="bisou, statut, canapé..."
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
            <option value="popular">Popularité</option>
            <option value="deadline">Échéance</option>
            <option value="odds">Cote</option>
            <option value="movement">Mouvement</option>
          </select>
        </label>
        <button
          className="min-h-11 rounded-md bg-[var(--brand)] px-4 text-sm font-black text-white md:col-start-4"
          type="submit"
        >
          Filtrer
        </button>
      </form>

      <MarketGroup markets={markets} title="Cotes disponibles" />
    </div>
  );
}
