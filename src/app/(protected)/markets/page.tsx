import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { PageHeading } from "@/components/astryx/page-heading";
import { CategoryTabs } from "@/components/sportsbook/category-tabs";
import { MarketFilters } from "@/components/sportsbook/market-filters";
import { MarketGroup } from "@/components/sportsbook/market-group";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";
import Link from "next/link";

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
        action={
          <Link
            aria-label="Voir le calendrier des marchés"
            className="rounded-md px-3 py-2 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/markets/calendar"
          >
            Calendrier
          </Link>
        }
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
