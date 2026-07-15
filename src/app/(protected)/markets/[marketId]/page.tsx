import { notFound } from "next/navigation";

import { MarketCard } from "@/components/sportsbook/market-card";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { getSeasonMarket } from "@/data/supabase/markets/market-repository";

export const dynamic = "force-dynamic";

interface MarketDetailPageProps {
  params: Promise<{ marketId: string }>;
}

export default async function MarketDetailPage({
  params,
}: MarketDetailPageProps) {
  const { marketId } = await params;
  const season = await requireSportsbookSeason();
  const market = await getSeasonMarket(season.id, marketId);

  if (!market) {
    notFound();
  }

  const oddsValues = market.history.map((point) => point.odds);
  const minimumOdds = oddsValues.length ? Math.min(...oddsValues) : 0;
  const maximumOdds = oddsValues.length ? Math.max(...oddsValues) : 0;
  const oddsRange = maximumOdds - minimumOdds;
  const chartPoints = market.history.map((point, index) => {
    const x =
      market.history.length === 1
        ? 150
        : 20 + index * (260 / (market.history.length - 1));
    const y =
      oddsRange === 0
        ? 60
        : 100 - ((point.odds - minimumOdds) / oddsRange) * 70;
    return { ...point, x, y };
  });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Fiche marché
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          {market.title}
        </h1>
      </header>
      <MarketCard market={market} />
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">Historique de cote</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Graphique SVG local, sans librairie externe. Les variations sont aussi
          lisibles en texte.
        </p>
        <svg
          aria-label={`Historique des cotes du marché ${market.title}`}
          className="mt-4 h-36 w-full"
          role="img"
          viewBox="0 0 300 120"
        >
          {[25, 60, 95].map((y) => (
            <line
              key={y}
              stroke="var(--border)"
              strokeWidth="1"
              x1="20"
              x2="280"
              y1={y}
              y2={y}
            />
          ))}
          <polyline
            fill="none"
            points={chartPoints
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            stroke="var(--brand)"
            strokeWidth="4"
          />
          {chartPoints.map((point) => (
            <circle
              cx={point.x}
              cy={point.y}
              fill="white"
              key={`${point.label}:${point.odds}`}
              r="5"
              stroke="var(--brand)"
              strokeWidth="3"
            />
          ))}
        </svg>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          {market.history.map((point) => (
            <div className="rounded-md bg-stone-50 p-3" key={point.label}>
              <dt className="text-xs font-bold text-[var(--text-muted)]">
                {point.label}
              </dt>
              <dd className="font-black">{point.odds.toFixed(2)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">Règle de règlement</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {market.settlementRule}
        </p>
      </section>
    </div>
  );
}
