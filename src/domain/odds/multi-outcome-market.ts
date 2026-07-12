import { validateMarketPricingContext } from "./context";
import { buildMarketPricingResult } from "./explanations";
import { priceMultiOutcomes } from "./pricing";
import type { MarketPricingResult, MultiOutcomePricingInput } from "./types";

export function priceGenericMultiOutcomeMarket(
  input: MultiOutcomePricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, false);
  const pricing = priceMultiOutcomes(input.outcomes, input.context);

  return buildMarketPricingResult({
    marketType: input.marketType,
    eventCode: input.eventCode,
    context: input.context,
    model: null,
    appliedModel: null,
    fairOutcomes: pricing.fairOutcomes,
    pricedOutcomes: pricing.pricedOutcomes,
    inputSnapshot: {
      rawOutcomes: input.outcomes.map(({ code, label, probability }) => ({
        code,
        label,
        probability,
      })),
      normalizationRawSum: pricing.normalization.rawSum,
    },
    adjustments: pricing.normalization.wasRequired
      ? ["multi-outcome:normalized"]
      : [],
  });
}
