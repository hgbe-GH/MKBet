import {
  priceBinaryMarket,
  priceDateRangeMarket,
  priceExactDateMarket,
  priceGenericMultiOutcomeMarket,
  priceNextActionMarket,
  priceOverUnderMarket,
  type MarketPricingInput,
  type MarketPricingResult,
} from "@/domain/odds";

export function buildMarketPricing(
  input: MarketPricingInput,
): MarketPricingResult {
  switch (input.marketType) {
    case "BINARY":
      return priceBinaryMarket(input);
    case "MULTI_OUTCOME":
      return priceGenericMultiOutcomeMarket(input);
    case "DATE_RANGE":
      return priceDateRangeMarket(input);
    case "EXACT_DATE":
      return priceExactDateMarket(input);
    case "NEXT_ACTION":
      return priceNextActionMarket(input);
    case "OVER_UNDER":
      return priceOverUnderMarket(input);
  }
}
