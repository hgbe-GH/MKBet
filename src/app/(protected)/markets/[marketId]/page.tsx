import { notFound } from "next/navigation";

import { MarketCard } from "@/components/sportsbook/market-card";
import { demoMarketRepository } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

interface MarketDetailPageProps {
  params: Promise<{ marketId: string }>;
}

export default async function MarketDetailPage({
  params,
}: MarketDetailPageProps) {
  const { marketId } = await params;
  const market = await demoMarketRepository.getMarket(marketId);

  if (!market) {
    notFound();
  }

  const max = Math.max(...market.history.map((point) => point.odds));

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
          <polyline
            fill="none"
            points={market.history
              .map((point, index) => {
                const x = 20 + index * (260 / (market.history.length - 1));
                const y = 110 - (point.odds / max) * 90;
                return `${x},${y}`;
              })
              .join(" ")}
            stroke="var(--brand)"
            strokeWidth="4"
          />
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
