import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { PageHeading } from "@/components/astryx/page-heading";
import { MarketCard } from "@/components/sportsbook/market-card";
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

  if (!market) notFound();

  const isBettingClosed = Date.parse(market.closesAt) <= new Date().getTime();

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
    <div className="space-y-6">
      <PageHeading
        action={
          <Button
            href="/markets"
            label="Retour aux marchés"
            variant="secondary"
          />
        }
        description="Cotes actuelles, historique textuel et règle de règlement."
        eyebrow="Fiche marché"
        title={market.title}
      />
      <MarketCard isBettingClosed={isBettingClosed} market={market} />
      <section aria-labelledby="odds-history-title">
        <Card padding={5}>
          <VStack gap={4}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Heading id="odds-history-title" level={2}>
                Historique de cote
              </Heading>
              <Badge label={`Version ${market.oddsVersion}`} variant="info" />
            </div>
            <Text color="secondary" type="supporting">
              Les variations sont disponibles visuellement et sous forme de
              valeurs lisibles.
            </Text>
            <svg
              aria-label={`Historique des cotes du marché ${market.title}`}
              className="h-36 w-full"
              role="img"
              viewBox="0 0 300 120"
            >
              {[25, 60, 95].map((y) => (
                <line
                  key={y}
                  stroke="var(--color-border)"
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
                stroke="var(--color-accent)"
                strokeWidth="4"
              />
              {chartPoints.map((point) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="var(--color-background-card)"
                  key={`${point.label}:${point.odds}`}
                  r="5"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                />
              ))}
            </svg>
            <MetadataList columns={3}>
              {market.history.map((point) => (
                <MetadataListItem key={point.label} label={point.label}>
                  {point.odds.toFixed(2)}
                </MetadataListItem>
              ))}
            </MetadataList>
          </VStack>
        </Card>
      </section>
      <section aria-labelledby="settlement-rule-title">
        <Card padding={5} variant="muted">
          <VStack gap={2}>
            <Heading id="settlement-rule-title" level={2}>
              Règle de règlement
            </Heading>
            <Text as="p" color="secondary">
              {market.settlementRule}
            </Text>
          </VStack>
        </Card>
      </section>
    </div>
  );
}
