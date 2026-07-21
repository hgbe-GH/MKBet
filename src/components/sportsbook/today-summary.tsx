import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export interface TodaySummaryProps {
  balanceMkb: number;
  rank: number | null;
  pendingCount: number;
  activeMarketCount: number;
}

export function TodaySummary({
  activeMarketCount,
  balanceMkb,
  pendingCount,
  rank,
}: TodaySummaryProps) {
  const formattedBalance = new Intl.NumberFormat("fr-FR").format(balanceMkb);

  return (
    <section aria-labelledby="today-summary-title">
      <Card padding={6} variant="muted">
        <VStack gap={4}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Text color="accent" display="block" type="label">
                Ton contexte
              </Text>
              <Heading id="today-summary-title" level={2}>
                {formattedBalance} MKB
              </Heading>
            </div>
            <Badge
              label={rank === null ? "Rang à venir" : `Rang #${rank}`}
              variant={rank === null ? "neutral" : "info"}
            />
          </div>
          <MetadataList columns={2}>
            <MetadataListItem label="Validations en attente">
              {pendingCount}
            </MetadataListItem>
            <MetadataListItem label="Marchés affichés">
              {activeMarketCount} sur 2 maximum
            </MetadataListItem>
          </MetadataList>
          <ProgressBar
            hasValueLabel
            label="Décisions du groupe à traiter"
            max={2}
            value={Math.min(pendingCount, 2)}
            variant={pendingCount > 0 ? "warning" : "success"}
          />
        </VStack>
      </Card>
    </section>
  );
}
