import { Heading } from "@astryxdesign/core/Heading";

import { AsyncState } from "@/components/astryx/async-state";
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
    return (
      <AsyncState
        description={emptyDescription}
        kind="empty"
        title="Aucun marché"
      />
    );
  }

  const titleId = `${title.toLocaleLowerCase("fr-FR").replaceAll(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <Heading id={titleId} level={2}>
        {title}
      </Heading>
      <div className="grid gap-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </section>
  );
}
