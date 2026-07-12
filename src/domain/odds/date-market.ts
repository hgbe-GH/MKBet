import { MILLISECONDS_PER_DAY, PROBABILITY_EPSILON, clamp } from "./constants";
import { validateMarketPricingContext } from "./context";
import { OddsDomainError } from "./errors";
import { buildMarketPricingResult } from "./explanations";
import { applyProbabilityModifiers } from "./modifiers";
import { priceBinaryOutcomes, priceMultiOutcomes } from "./pricing";
import {
  cumulativeProbabilityForEffectiveModel,
  elapsedDaysBetween,
} from "./probability";
import type {
  DateRangePricingInput,
  ExactDatePricingInput,
  MarketPricingResult,
} from "./types";
import { parseUtcTimestamp } from "./validation";

function conditionalPeriodProbability(
  input: DateRangePricingInput | ExactDatePricingInput,
  startAt: string,
  endAt: string,
): {
  probability: number;
  appliedModel: ReturnType<typeof applyProbabilityModifiers>;
} {
  const { context, model } = input;
  const asOfMs = parseUtcTimestamp(context.asOf, "asOf");
  const startMs = parseUtcTimestamp(startAt, "startAt");
  const endMs = parseUtcTimestamp(endAt, "endAt");
  if (endMs <= startMs || endMs <= asOfMs) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "La période doit se terminer après son début et asOf.",
    );
  }

  const appliedModel = applyProbabilityModifiers(
    model,
    context.modifiers,
    context.asOf,
    context.liveContext,
  );
  const currentDays = elapsedDaysBetween(context.seasonStartAt, context.asOf);
  const startDays = elapsedDaysBetween(
    context.seasonStartAt,
    new Date(Math.max(startMs, asOfMs)).toISOString(),
  );
  const endDays = elapsedDaysBetween(context.seasonStartAt, endAt);
  const atCurrent = cumulativeProbabilityForEffectiveModel(
    appliedModel.model,
    currentDays,
  );
  const atStart = cumulativeProbabilityForEffectiveModel(
    appliedModel.model,
    startDays,
  );
  const atEnd = cumulativeProbabilityForEffectiveModel(
    appliedModel.model,
    endDays,
  );
  const denominator = 1 - atCurrent;
  const probability =
    denominator <= PROBABILITY_EPSILON ? 0 : (atEnd - atStart) / denominator;

  return { probability: clamp(probability, 0, 1), appliedModel };
}

export function priceDateRangeMarket(
  input: DateRangePricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, true);
  if (input.periods.length === 0) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "Au moins une période est requise.",
    );
  }

  let previousEnd = Number.NEGATIVE_INFINITY;
  const fairPeriods = input.periods.map((period) => {
    const start = parseUtcTimestamp(period.startAt, `${period.code}.startAt`);
    const end = parseUtcTimestamp(period.endAt, `${period.code}.endAt`);
    if (end <= start || start < previousEnd) {
      throw new OddsDomainError(
        "INVALID_INTERVAL",
        "Les périodes doivent être ordonnées et disjointes.",
        {
          periodCode: period.code,
        },
      );
    }
    previousEnd = end;
    const { probability } = conditionalPeriodProbability(
      input,
      period.startAt,
      period.endAt,
    );
    return { code: period.code, label: period.label, probability };
  });
  const periodTotal = fairPeriods.reduce(
    (sum, { probability }) => sum + probability,
    0,
  );
  if (periodTotal > 1 + PROBABILITY_EPSILON) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "Les périodes dépassent la masse disponible.",
    );
  }
  const weighted = [
    ...fairPeriods,
    {
      code: input.residualOutcome.code,
      label: input.residualOutcome.label,
      probability: clamp(1 - periodTotal, 0, 1),
    },
  ];
  const pricing = priceMultiOutcomes(weighted, input.context);
  const appliedModel = applyProbabilityModifiers(
    input.model,
    input.context.modifiers,
    input.context.asOf,
    input.context.liveContext,
  );

  return buildMarketPricingResult({
    marketType: input.marketType,
    eventCode: input.eventCode,
    context: input.context,
    model: input.model,
    appliedModel,
    fairOutcomes: pricing.fairOutcomes,
    pricedOutcomes: pricing.pricedOutcomes,
    inputSnapshot: {
      periods: input.periods.map((period) => ({ ...period })),
      residualOutcome: { ...input.residualOutcome },
      normalizationRawSum: pricing.normalization.rawSum,
    },
    adjustments: pricing.normalization.wasRequired
      ? ["multi-outcome:normalized"]
      : [],
  });
}

export function priceExactDateMarket(
  input: ExactDatePricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, false);
  const start = parseUtcTimestamp(input.dayStartAt, "dayStartAt");
  const end = parseUtcTimestamp(input.dayEndAt, "dayEndAt");
  if (
    end - start !== MILLISECONDS_PER_DAY ||
    start % MILLISECONDS_PER_DAY !== 0
  ) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "Une date exacte doit couvrir exactement une journée UTC à partir de minuit.",
    );
  }
  const { probability, appliedModel } = conditionalPeriodProbability(
    input,
    input.dayStartAt,
    input.dayEndAt,
  );
  const pricedOutcomes = priceBinaryOutcomes(probability, input.context);
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
    inputSnapshot: { dayStartAt: input.dayStartAt, dayEndAt: input.dayEndAt },
  });
}

export function exactDateSettlementCoefficient(
  predictedDayStartAt: string,
  actualOccurredAt: string,
  tolerance: { oneDay: number; twoDays: number } = {
    oneDay: 0.6,
    twoDays: 0.3,
  },
): number {
  const predictedDay = Math.floor(
    parseUtcTimestamp(predictedDayStartAt, "predictedDayStartAt") /
      MILLISECONDS_PER_DAY,
  );
  const actualDay = Math.floor(
    parseUtcTimestamp(actualOccurredAt, "actualOccurredAt") /
      MILLISECONDS_PER_DAY,
  );
  if (
    !Number.isFinite(tolerance.oneDay) ||
    !Number.isFinite(tolerance.twoDays) ||
    tolerance.oneDay < 0 ||
    tolerance.oneDay > 1 ||
    tolerance.twoDays < 0 ||
    tolerance.twoDays > tolerance.oneDay
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "La tolérance de règlement est invalide.",
    );
  }

  const difference = Math.abs(actualDay - predictedDay);
  if (difference === 0) return 1;
  if (difference === 1) return tolerance.oneDay;
  if (difference === 2) return tolerance.twoDays;
  return 0;
}
