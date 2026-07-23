import { groupMarketsByUtcDay } from "@/application/sportsbook/market-calendar";
import { parseMarketCalendarSearchParams } from "@/application/sportsbook/calendar-query";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { PageHeading } from "@/components/astryx/page-heading";
import {
  MarketCalendar,
  MarketCalendarControls,
} from "@/components/sportsbook/market-calendar";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";

export const dynamic = "force-dynamic";

interface MarketCalendarPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketCalendarPage({
  searchParams,
}: MarketCalendarPageProps) {
  const rawParams = (await searchParams) ?? {};
  const filters = parseMarketCalendarSearchParams(rawParams);
  const season = await requireSportsbookSeason();
  const markets = await listSeasonMarkets(season.id, {
    category: filters.category,
    status: filters.status,
    sort: "deadline",
    q: "",
  });
  const groups = groupMarketsByUtcDay(markets, filters.weekStart, new Date());

  return (
    <div className="space-y-6">
      <PageHeading
        description="Consulte les fenêtres de mise et l’échéance réelle de chaque fait."
        eyebrow="Marchés"
        title="Calendrier des marchés"
      />
      <MarketCalendarControls {...filters} />
      <MarketCalendar groups={groups} />
    </div>
  );
}
