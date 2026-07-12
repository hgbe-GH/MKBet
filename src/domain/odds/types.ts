export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type OddsErrorCode =
  | "INVALID_DATE"
  | "INVALID_INTERVAL"
  | "DEADLINE_NOT_IN_FUTURE"
  | "INVALID_PROBABILITY_MODEL"
  | "INVALID_MARGIN"
  | "INVALID_ODDS_VERSION"
  | "INVALID_MODIFIER"
  | "INVALID_MARKET_OUTCOMES"
  | "INVALID_ACCUMULATOR"
  | "MISSING_CORRELATION_RULE"
  | "INTEGER_LINE_UNSUPPORTED"
  | "MARKET_NOT_REPRICEABLE"
  | "MISSING_OUTCOME_IDENTIFIER";

export type EventFamily = "PHYSICAL" | "SENTIMENTAL" | "MIXED";

export interface EventProbabilityModel {
  readonly eventCode: string;
  readonly family: EventFamily;
  readonly baseQ: number;
  readonly baseHalfLifeDays: number;
  readonly minimumQ: number;
  readonly maximumQ: number;
  readonly minimumHalfLifeDays: number;
  readonly maximumHalfLifeDays: number;
}

export interface EffectiveProbabilityModel {
  readonly eventCode: string;
  readonly family: EventFamily;
  readonly q: number;
  readonly halfLifeDays: number;
}

export type ProbabilityModifierType = "Q_SHIFT" | "SPEED_MULTIPLIER";

export interface ProbabilityModifier {
  readonly id: string;
  readonly source: string;
  readonly description: string;
  readonly type: ProbabilityModifierType;
  readonly value: number;
  readonly priority: number;
  readonly effectiveFrom?: string;
  readonly expiresAt?: string;
  readonly metadata: JsonObject;
}

export interface AppliedModifier extends ProbabilityModifier {
  readonly appliedAt: string;
}

export interface LiveProbabilityContext {
  readonly physicalContextMultiplier: number;
  readonly sentimentalContextMultiplier: number;
}

export interface AppliedModelResult {
  readonly model: EffectiveProbabilityModel;
  readonly appliedModifiers: readonly AppliedModifier[];
  readonly clamps: readonly string[];
}

export interface PricingBounds {
  readonly margin: number;
  readonly minimumDisplayedOdds: number;
  readonly maximumDisplayedOdds: number;
}

export interface FairOutcome {
  readonly code: string;
  readonly label: string;
  readonly probability: number;
}

export interface PricedOutcome {
  readonly code: string;
  readonly label: string;
  readonly fairProbability: number;
  readonly marginAdjustedProbability: number;
  readonly rawDisplayedOdds: number | null;
  readonly displayedOdds: number;
  readonly impliedProbabilityAfterMargin: number;
  readonly wasClipped: boolean;
}

export interface WeightedOutcome {
  readonly code: string;
  readonly label: string;
  readonly probability: number;
}

export interface MultiOutcomePricingResult {
  readonly fairOutcomes: readonly FairOutcome[];
  readonly pricedOutcomes: readonly PricedOutcome[];
  readonly normalization: {
    readonly rawSum: number;
    readonly normalizedSum: number;
    readonly wasRequired: boolean;
  };
}

export interface MarketPricingContext extends PricingBounds {
  readonly seasonStartAt: string;
  readonly asOf: string;
  readonly calculatedAt: string;
  readonly deadlineAt?: string;
  readonly reason: string;
  readonly nextOddsVersion: number;
  readonly modifiers: readonly ProbabilityModifier[];
  readonly liveContext?: LiveProbabilityContext;
}

export type SupportedMarketType =
  | "BINARY"
  | "MULTI_OUTCOME"
  | "DATE_RANGE"
  | "EXACT_DATE"
  | "NEXT_ACTION"
  | "OVER_UNDER";

export interface OddsCalculationExplanation {
  readonly model: JsonObject | null;
  readonly effectiveModel: JsonObject | null;
  readonly referenceAt: string;
  readonly deadlineAt: string | null;
  readonly appliedModifiers: readonly AppliedModifier[];
  readonly fairProbabilities: JsonObject;
  readonly margin: number;
  readonly displayedOdds: JsonObject;
  readonly adjustments: readonly string[];
  readonly reason: string;
}

export interface MarketPricingResult {
  readonly marketType: SupportedMarketType;
  readonly eventCode: string;
  readonly oddsVersion: number;
  readonly calculatedAt: string;
  readonly asOf: string;
  readonly deadlineAt: string | null;
  readonly model: EventProbabilityModel | null;
  readonly effectiveModel: EffectiveProbabilityModel | null;
  readonly appliedModifiers: readonly AppliedModifier[];
  readonly fairOutcomes: readonly FairOutcome[];
  readonly pricedOutcomes: readonly PricedOutcome[];
  readonly margin: number;
  readonly minimumDisplayedOdds: number;
  readonly maximumDisplayedOdds: number;
  readonly reason: string;
  readonly warnings: readonly string[];
  readonly inputSnapshot: JsonObject;
  readonly explanation: OddsCalculationExplanation;
}

export interface BinaryPricingInput {
  readonly marketType: "BINARY";
  readonly eventCode: string;
  readonly model: EventProbabilityModel;
  readonly context: MarketPricingContext;
}

export interface MultiOutcomePricingInput {
  readonly marketType: "MULTI_OUTCOME";
  readonly eventCode: string;
  readonly context: MarketPricingContext;
  readonly outcomes: readonly WeightedOutcome[];
}

export interface DateRangePeriod {
  readonly code: string;
  readonly label: string;
  readonly startAt: string;
  readonly endAt: string;
}

export interface DateRangePricingInput {
  readonly marketType: "DATE_RANGE";
  readonly eventCode: string;
  readonly model: EventProbabilityModel;
  readonly context: MarketPricingContext;
  readonly periods: readonly DateRangePeriod[];
  readonly residualOutcome: { readonly code: string; readonly label: string };
}

export interface ExactDatePricingInput {
  readonly marketType: "EXACT_DATE";
  readonly eventCode: string;
  readonly model: EventProbabilityModel;
  readonly context: MarketPricingContext;
  readonly dayStartAt: string;
  readonly dayEndAt: string;
}

export type NextActionWeightModifierType = "WEIGHT_SHIFT" | "WEIGHT_MULTIPLIER";

export interface NextActionWeightModifier {
  readonly id: string;
  readonly type: NextActionWeightModifierType;
  readonly value: number;
}

export interface NextActionCandidate {
  readonly code: string;
  readonly label: string;
  readonly baseWeight: number;
  readonly contextMultiplier: number;
  readonly available: boolean;
  readonly modifiers: readonly NextActionWeightModifier[];
  readonly requiredConfirmedEventCodes: readonly string[];
  readonly excludedWhenConfirmedEventCodes: readonly string[];
}

export interface NextActionPricingInput {
  readonly marketType: "NEXT_ACTION";
  readonly eventCode: string;
  readonly context: MarketPricingContext;
  readonly confirmedEventCodes: readonly string[];
  readonly candidates: readonly NextActionCandidate[];
}

export interface OverUnderPricingInput {
  readonly marketType: "OVER_UNDER";
  readonly eventCode: string;
  readonly context: MarketPricingContext;
  readonly lambda: number;
  readonly line: number;
}

export type MarketPricingInput =
  | BinaryPricingInput
  | MultiOutcomePricingInput
  | DateRangePricingInput
  | ExactDatePricingInput
  | NextActionPricingInput
  | OverUnderPricingInput;

export interface AccumulatorSelection {
  readonly selectionId: string;
  readonly marketId: string;
  readonly outcomeCode: string;
  readonly eventCode: string;
  readonly fairProbability: number;
  readonly displayedOdds: number;
  readonly marketStatus: string;
  readonly outcomeStatus: string;
  readonly stronglyDependentWithEventCodes: readonly string[];
  readonly contradictsSelectionIds: readonly string[];
}

export interface CorrelationRule {
  readonly id: string;
  readonly eventCodes: readonly string[];
  readonly correlationAdjustment: number;
  readonly description: string;
  readonly allowedMarketStatuses?: readonly string[];
}

export interface AccumulatorPricingInput extends PricingBounds {
  readonly selections: readonly AccumulatorSelection[];
  readonly correlationRules: readonly CorrelationRule[];
}

export interface AccumulatorPricingResult {
  readonly selections: readonly AccumulatorSelection[];
  readonly independentFairProbability: number;
  readonly correlationAdjustment: number;
  readonly correlationRuleId: string | null;
  readonly combinedFairProbability: number;
  readonly rawDisplayedOdds: number;
  readonly displayedOdds: number;
  readonly naiveDisplayedOddsProduct: number;
  readonly explanation: JsonObject;
}
