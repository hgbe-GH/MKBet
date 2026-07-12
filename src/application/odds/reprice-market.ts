import {
  OddsDomainError,
  type MarketPricingInput,
  type MarketPricingResult,
} from "@/domain/odds";
import type { Market } from "@/domain/database/entities";

import { buildMarketPricing } from "./build-market-pricing";
import {
  buildOddsSnapshotDraft,
  type OddsSnapshotDraft,
  type SnapshotIdentifiers,
} from "./build-odds-snapshot";

export interface RepriceMarketInput {
  readonly market: Market;
  readonly pricingInput: MarketPricingInput;
  readonly identifiers: SnapshotIdentifiers;
}

export interface RepriceMarketResult {
  readonly pricing: MarketPricingResult;
  readonly snapshots: OddsSnapshotDraft;
  readonly identifiers: SnapshotIdentifiers;
}

export function repriceMarket(input: RepriceMarketInput): RepriceMarketResult {
  if (["SETTLED", "VOID", "REFUNDED"].includes(input.market.status)) {
    throw new OddsDomainError(
      "MARKET_NOT_REPRICEABLE",
      `Le marché ${input.market.status} ne peut pas être recalculé.`,
      { marketId: input.market.id, status: input.market.status },
    );
  }
  if (
    input.pricingInput.context.nextOddsVersion !==
      input.market.oddsVersion + 1 ||
    input.pricingInput.eventCode !== input.market.eventCode ||
    input.pricingInput.marketType !== input.market.marketType
  ) {
    throw new OddsDomainError(
      "INVALID_ODDS_VERSION",
      "Le pricing doit correspondre au marché et utiliser exactement la version suivante.",
      {
        currentOddsVersion: input.market.oddsVersion,
        requestedOddsVersion: input.pricingInput.context.nextOddsVersion,
      },
    );
  }

  const pricing = buildMarketPricing(input.pricingInput);
  return {
    pricing,
    snapshots: buildOddsSnapshotDraft(pricing, input.identifiers),
    identifiers: input.identifiers,
  };
}
