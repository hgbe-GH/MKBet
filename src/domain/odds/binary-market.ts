import { validateMarketPricingContext } from "./context";
import { buildMarketPricingResult } from "./explanations";
import { applyProbabilityModifiers } from "./modifiers";
import { priceBinaryOutcomes } from "./pricing";
import {
  conditionalProbabilityForEffectiveModel,
  elapsedDaysBetween,
} from "./probability";
import type { BinaryPricingInput, MarketPricingResult } from "./types";

export function priceBinaryMarket(
  input: BinaryPricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, true);
  const deadlineAt = input.context.deadlineAt!;
  const appliedModel = applyProbabilityModifiers(
    input.model,
    input.context.modifiers,
    input.context.asOf,
    input.context.liveContext,
  );
  const currentDays = elapsedDaysBetween(
    input.context.seasonStartAt,
    input.context.asOf,
  );
  const deadlineDays = elapsedDaysBetween(
    input.context.seasonStartAt,
    deadlineAt,
  );
  const yesProbability = conditionalProbabilityForEffectiveModel(
    appliedModel.model,
    currentDays,
    deadlineDays,
  );
  const pricedOutcomes = priceBinaryOutcomes(yesProbability, input.context);
  const fairOutcomes = pricedOutcomes.map(
    ({ code, label, fairProbability }) => ({
      code,
      label,
      probability: fairProbability,
    }),
  );

  return buildMarketPricingResult({
    marketType: input.marketType,
    eventCode: input.eventCode,
    context: input.context,
    model: input.model,
    appliedModel,
    fairOutcomes,
    pricedOutcomes,
    inputSnapshot: {
      seasonStartAt: input.context.seasonStartAt,
      asOf: input.context.asOf,
      deadlineAt,
      currentElapsedDays: currentDays,
      deadlineElapsedDays: deadlineDays,
    },
  });
}
