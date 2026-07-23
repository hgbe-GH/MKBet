import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { PageHeading } from "@/components/astryx/page-heading";
import { CategoryTabs } from "@/components/sportsbook/category-tabs";
import { MarketFilters } from "@/components/sportsbook/market-filters";
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
    <div className="space-y-6">
      <PageHeading
        description={`Les cotes officielles de ${season.title}. Le devis PostgreSQL reste l’autorité avant confirmation.`}
        eyebrow="Salle privée"
        title="Marchés"
      />
      <CategoryTabs
        activeCategory={filters.category}
        q={filters.q}
        sort={filters.sort}
        status={filters.status}
      />
      <MarketFilters
        category={filters.category}
        initialQuery={filters.q}
        initialSort={filters.sort}
        initialStatus={filters.status}
      />
      <MarketGroup
        emptyDescription="Aucun marché ouvert. Le comité doit encore publier les premières cotes."
        markets={markets}
        title="Cotes disponibles"
      />
    </div>
  );
}
