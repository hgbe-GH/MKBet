import { EmptyState } from "@/components/states/empty-state";
import { MarketCard } from "@/components/sportsbook/market-card";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";

export function MarketGroup({
  title,
  markets,
  emptyDescription = "Aucune cote ne correspond à ces filtres. Le chaos n’est pas toujours liquide.",
}: {
  title: string;
  markets: SportsbookMarket[];
  emptyDescription?: string;
}) {
  if (markets.length === 0) {
    return <EmptyState description={emptyDescription} title="Aucun marché" />;
  }

  return (
    <section aria-labelledby={`${title}-title`} className="space-y-3">
      <h2 className="text-xl font-black" id={`${title}-title`}>
        {title}
      </h2>
      <div className="grid gap-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </section>
  );
}
