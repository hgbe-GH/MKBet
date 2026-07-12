import { validateMarketPricingContext } from "./context";
import { OddsDomainError } from "./errors";
import { buildMarketPricingResult } from "./explanations";
import { priceMultiOutcomes } from "./pricing";
import type { MarketPricingResult, OverUnderPricingInput } from "./types";

export function poissonProbability(lambda: number, count: number): number {
  if (
    !Number.isFinite(lambda) ||
    lambda <= 0 ||
    !Number.isInteger(count) ||
    count < 0
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "Les paramètres de Poisson sont invalides.",
    );
  }
  let probability = Math.exp(-lambda);
  for (let index = 1; index <= count; index += 1) {
    probability *= lambda / index;
  }
  return probability;
}

export function priceOverUnderMarket(
  input: OverUnderPricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, false);
  if (
    !Number.isFinite(input.lambda) ||
    input.lambda <= 0 ||
    !Number.isFinite(input.line) ||
    input.line < 0
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "Lambda et la ligne doivent être valides.",
    );
  }
  if (Number.isInteger(input.line)) {
    throw new OddsDomainError(
      "INTEGER_LINE_UNSUPPORTED",
      "Les lignes entières ne sont pas prises en charge dans ce MVP.",
      { line: input.line },
    );
  }
  if (Math.abs(input.line * 2 - Math.round(input.line * 2)) > Number.EPSILON) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "La ligne doit être un demi-point.",
    );
  }

  const maximumUnderCount = Math.floor(input.line);
  let under = 0;
  let term = Math.exp(-input.lambda);
  for (let count = 0; count <= maximumUnderCount; count += 1) {
    if (count > 0) term *= input.lambda / count;
    under += term;
  }
  under = Math.min(Math.max(under, 0), 1);
  const pricing = priceMultiOutcomes(
    [
      { code: "UNDER", label: "Moins", probability: under },
      { code: "OVER", label: "Plus", probability: 1 - under },
    ],
    input.context,
  );

  return buildMarketPricingResult({
    marketType: input.marketType,
    eventCode: input.eventCode,
    context: input.context,
    model: null,
    appliedModel: null,
    fairOutcomes: pricing.fairOutcomes,
    pricedOutcomes: pricing.pricedOutcomes,
    inputSnapshot: {
      lambda: input.lambda,
      line: input.line,
      distribution: "POISSON",
    },
    warnings: ["Poisson est une approximation ludique configurable."],
  });
}
