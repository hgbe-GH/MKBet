"use client";

import { Badge, type BadgeVariant } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { useBetSlip } from "@/components/sportsbook/bet-slip-context";
import { OddsButton } from "@/components/sportsbook/odds-button";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";
import { cn } from "@/lib/utils";

function marketTypeLabel(type: SportsbookMarket["type"]) {
  if (type === "BINARY") return "Binaire";
  if (type === "MULTI_OUTCOME" || type === "NEXT_ACTION") {
    return "Multi-options";
  }
  if (type === "OVER_UNDER") return "Over / Under";
  if (type === "EXACT_DATE" || type === "DATE_RANGE") return "Date";
  return "Combiné";
}

function statusVariant(status: SportsbookMarket["status"]): BadgeVariant {
  if (status === "OPEN") return "success";
  if (status === "SUSPENDED") return "warning";
  return "neutral";
}

export function MarketCard({
  isBettingClosed = false,
  market,
}: {
  isBettingClosed?: boolean;
  market: SportsbookMarket;
}) {
  const betSlip = useBetSlip();
  const deadline = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(market.deadline));

  return (
    <article>
      <Card padding={5}>
        <VStack gap={4}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {market.isLive ? (
                  <Badge label="Direct" variant="error" />
                ) : null}
                <Badge
                  label={isBettingClosed ? "Mises fermées" : market.status}
                  variant={
                    isBettingClosed ? "neutral" : statusVariant(market.status)
                  }
                />
                <Badge label={marketTypeLabel(market.type)} variant="neutral" />
              </div>
              <Heading level={2}>
                <Button
                  className="-ml-3 justify-start"
                  href={`/markets/${market.id}`}
                  label={market.title}
                  variant="ghost"
                />
              </Heading>
              {market.trashTitle ? (
                <Text color="accent" display="block" type="supporting">
                  {market.trashTitle}
                </Text>
              ) : null}
            </div>
            <MetadataList>
              <MetadataListItem label="Volume">
                {market.betCount > 0
                  ? `${market.betCount} tickets`
                  : "Volume privé"}
              </MetadataListItem>
              <MetadataListItem label="Clôture">
                <time dateTime={market.deadline}>{deadline}</time>
              </MetadataListItem>
            </MetadataList>
          </div>

          <Text as="p" color="secondary">
            {market.description}
          </Text>
          {market.lastAction ? (
            <Card padding={3} variant="red">
              <Text type="supporting">
                Dernier signal : {market.lastAction}
              </Text>
            </Card>
          ) : null}
          {market.suspensionReason ? (
            <Card padding={3} variant="yellow">
              <Text type="supporting">
                Suspension : {market.suspensionReason}
              </Text>
            </Card>
          ) : null}

          <div
            className={cn(
              "grid gap-2 sm:grid-cols-2",
              market.outcomes.length > 2 && "lg:grid-cols-3",
            )}
          >
            {market.outcomes.map((outcome) => (
              <OddsButton
                key={outcome.id}
                handicap={outcome.handicap}
                isBettingClosed={isBettingClosed}
                line={outcome.line}
                marketId={market.id}
                marketTitle={market.title}
                movement={outcome.movement}
                odds={outcome.odds}
                oddsVersion={market.oddsVersion}
                outcomeId={outcome.id}
                outcomeLabel={outcome.label}
                selected={betSlip.isSelected(market.id, outcome.id)}
                status={outcome.status}
              />
            ))}
          </div>

          <MetadataList orientation="horizontal">
            <MetadataListItem label="Catégorie">
              {market.category}
            </MetadataListItem>
            <MetadataListItem label="Variation">
              {market.variationLabel}
            </MetadataListItem>
          </MetadataList>
        </VStack>
      </Card>
    </article>
  );
}
