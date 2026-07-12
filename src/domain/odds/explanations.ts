import type {
  AppliedModelResult,
  FairOutcome,
  JsonObject,
  MarketPricingContext,
  MarketPricingResult,
  PricedOutcome,
  SupportedMarketType,
  EventProbabilityModel,
} from "./types";

interface BuildResultInput {
  readonly marketType: SupportedMarketType;
  readonly eventCode: string;
  readonly context: MarketPricingContext;
  readonly model: EventProbabilityModel | null;
  readonly appliedModel: AppliedModelResult | null;
  readonly fairOutcomes: readonly FairOutcome[];
  readonly pricedOutcomes: readonly PricedOutcome[];
  readonly inputSnapshot: JsonObject;
  readonly warnings?: readonly string[];
  readonly adjustments?: readonly string[];
}

function modelSnapshot(model: EventProbabilityModel): JsonObject {
  return {
    eventCode: model.eventCode,
    family: model.family,
    baseQ: model.baseQ,
    baseHalfLifeDays: model.baseHalfLifeDays,
    minimumQ: model.minimumQ,
    maximumQ: model.maximumQ,
    minimumHalfLifeDays: model.minimumHalfLifeDays,
    maximumHalfLifeDays: model.maximumHalfLifeDays,
  };
}

export function buildMarketPricingResult(
  input: BuildResultInput,
): MarketPricingResult {
  const { context, appliedModel } = input;
  const fairProbabilities: JsonObject = Object.fromEntries(
    input.fairOutcomes.map(({ code, probability }) => [code, probability]),
  );
  const displayedOdds: JsonObject = Object.fromEntries(
    input.pricedOutcomes.map(({ code, displayedOdds: odds }) => [code, odds]),
  );
  const initialModel = input.model ? modelSnapshot(input.model) : null;
  const effectiveModel = appliedModel
    ? {
        eventCode: appliedModel.model.eventCode,
        family: appliedModel.model.family,
        q: appliedModel.model.q,
        halfLifeDays: appliedModel.model.halfLifeDays,
      }
    : null;
  const adjustments = [
    ...(input.adjustments ?? []),
    ...(appliedModel?.clamps ?? []),
    ...input.pricedOutcomes
      .filter(({ wasClipped }) => wasClipped)
      .map(({ code }) => `odds:${code}:clipped`),
  ];

  return {
    marketType: input.marketType,
    eventCode: input.eventCode,
    oddsVersion: context.nextOddsVersion,
    calculatedAt: context.calculatedAt,
    asOf: context.asOf,
    deadlineAt: context.deadlineAt ?? null,
    model: input.model,
    effectiveModel: appliedModel?.model ?? null,
    appliedModifiers: appliedModel?.appliedModifiers ?? [],
    fairOutcomes: input.fairOutcomes,
    pricedOutcomes: input.pricedOutcomes,
    margin: context.margin,
    minimumDisplayedOdds: context.minimumDisplayedOdds,
    maximumDisplayedOdds: context.maximumDisplayedOdds,
    reason: context.reason,
    warnings: input.warnings ?? [],
    inputSnapshot: input.inputSnapshot,
    explanation: {
      model: initialModel,
      effectiveModel,
      referenceAt: context.asOf,
      deadlineAt: context.deadlineAt ?? null,
      appliedModifiers: appliedModel?.appliedModifiers ?? [],
      fairProbabilities,
      margin: context.margin,
      displayedOdds,
      adjustments,
      reason: context.reason,
    },
  };
}
