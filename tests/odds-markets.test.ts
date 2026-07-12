// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  exactDateSettlementCoefficient,
  priceAccumulator,
  priceDateRangeMarket,
  priceExactDateMarket,
  priceNextActionMarket,
  priceOverUnderMarket,
  type AccumulatorSelection,
  type MarketPricingContext,
} from "@/domain/odds";
import {
  INITIAL_EVENT_MODELS,
  INITIAL_CORRELATION_RULES,
} from "@/fixtures/odds/initial-models";

const CONTEXT: MarketPricingContext = {
  seasonStartAt: "2026-07-01T00:00:00.000Z",
  asOf: "2026-07-06T00:00:00.000Z",
  calculatedAt: "2026-07-06T00:00:00.000Z",
  deadlineAt: "2026-07-31T00:00:00.000Z",
  margin: 1.08,
  minimumDisplayedOdds: 1.05,
  maximumDisplayedOdds: 50,
  reason: "TEST_REPRICE",
  nextOddsVersion: 2,
  modifiers: [],
};

describe("date markets", () => {
  it("prices adjacent conditional periods and an explicit residual to one", () => {
    const result = priceDateRangeMarket({
      marketType: "DATE_RANGE",
      eventCode: "KISS",
      model: INITIAL_EVENT_MODELS.KISS,
      context: CONTEXT,
      periods: [
        {
          code: "DAYS_5_15",
          label: "Entre J+5 et J+15",
          startAt: "2026-07-06T00:00:00.000Z",
          endAt: "2026-07-16T00:00:00.000Z",
        },
        {
          code: "DAYS_15_30",
          label: "Entre J+15 et J+30",
          startAt: "2026-07-16T00:00:00.000Z",
          endAt: "2026-07-31T00:00:00.000Z",
        },
      ],
      residualOutcome: { code: "AFTER_OR_NEVER", label: "Après ou jamais" },
    });

    expect(result.fairOutcomes).toHaveLength(3);
    expect(
      result.fairOutcomes.reduce(
        (sum, outcome) => sum + outcome.probability,
        0,
      ),
    ).toBeCloseTo(1, 12);
    expect(result.fairOutcomes[0]!.probability).toBeGreaterThan(0);
  });

  it("rejects overlapping periods", () => {
    expect(() =>
      priceDateRangeMarket({
        marketType: "DATE_RANGE",
        eventCode: "KISS",
        model: INITIAL_EVENT_MODELS.KISS,
        context: CONTEXT,
        periods: [
          {
            code: "A",
            label: "A",
            startAt: "2026-07-06T00:00:00.000Z",
            endAt: "2026-07-20T00:00:00.000Z",
          },
          {
            code: "B",
            label: "B",
            startAt: "2026-07-19T00:00:00.000Z",
            endAt: "2026-07-31T00:00:00.000Z",
          },
        ],
        residualOutcome: { code: "REST", label: "Reste" },
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INTERVAL" }));
  });

  it("prices exactly one explicit 24-hour UTC day", () => {
    const result = priceExactDateMarket({
      marketType: "EXACT_DATE",
      eventCode: "KISS",
      model: INITIAL_EVENT_MODELS.KISS,
      context: CONTEXT,
      dayStartAt: "2026-07-20T00:00:00.000Z",
      dayEndAt: "2026-07-21T00:00:00.000Z",
    });

    expect(result.fairOutcomes[0]).toMatchObject({ code: "YES" });
    expect(result.fairOutcomes[0]!.probability).toBeGreaterThan(0);
    expect(result.inputSnapshot).toMatchObject({
      dayStartAt: "2026-07-20T00:00:00.000Z",
      dayEndAt: "2026-07-21T00:00:00.000Z",
    });
  });

  it("computes settlement tolerance independently from pricing", () => {
    const expected = "2026-07-20T00:00:00.000Z";
    expect(exactDateSettlementCoefficient(expected, expected)).toBe(1);
    expect(
      exactDateSettlementCoefficient(expected, "2026-07-21T12:00:00.000Z"),
    ).toBe(0.6);
    expect(
      exactDateSettlementCoefficient(expected, "2026-07-18T23:59:59.000Z"),
    ).toBe(0.3);
    expect(
      exactDateSettlementCoefficient(expected, "2026-07-23T00:00:00.000Z"),
    ).toBe(0);
  });
});

describe("next action and over/under markets", () => {
  it("normalizes available next actions and requires an explicit NONE outcome", () => {
    const result = priceNextActionMarket({
      marketType: "NEXT_ACTION",
      eventCode: "NEXT_ACTION",
      context: CONTEXT,
      confirmedEventCodes: ["HUG"],
      candidates: [
        {
          code: "KISS",
          label: "Bisou",
          baseWeight: 3,
          contextMultiplier: 1.2,
          available: true,
          modifiers: [
            { id: "kiss-live", type: "WEIGHT_MULTIPLIER", value: 1.1 },
          ],
          requiredConfirmedEventCodes: ["HUG"],
          excludedWhenConfirmedEventCodes: [],
        },
        {
          code: "LEAVE",
          label: "Départ ensemble",
          baseWeight: 2,
          contextMultiplier: 1,
          available: false,
          modifiers: [],
          requiredConfirmedEventCodes: [],
          excludedWhenConfirmedEventCodes: [],
        },
        {
          code: "NONE",
          label: "Rien avant la fin",
          baseWeight: 1,
          contextMultiplier: 1,
          available: true,
          modifiers: [],
          requiredConfirmedEventCodes: [],
          excludedWhenConfirmedEventCodes: [],
        },
      ],
    });

    expect(result.fairOutcomes.map(({ code }) => code)).toEqual([
      "KISS",
      "NONE",
    ]);
    expect(
      result.fairOutcomes.reduce(
        (sum, outcome) => sum + outcome.probability,
        0,
      ),
    ).toBe(1);
  });

  it("prices known Poisson values for half-point lines", () => {
    const result = priceOverUnderMarket({
      marketType: "OVER_UNDER",
      eventCode: "DENIAL_COUNT",
      context: CONTEXT,
      lambda: 1,
      line: 0.5,
    });

    expect(
      result.fairOutcomes.find(({ code }) => code === "UNDER")!.probability,
    ).toBeCloseTo(Math.exp(-1), 12);
    expect(
      result.fairOutcomes.reduce(
        (sum, outcome) => sum + outcome.probability,
        0,
      ),
    ).toBeCloseTo(1, 12);
  });

  it("rejects invalid lambda and integer lines with stable codes", () => {
    expect(() =>
      priceOverUnderMarket({
        marketType: "OVER_UNDER",
        eventCode: "COUNT",
        context: CONTEXT,
        lambda: 0,
        line: 0.5,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "INVALID_MARKET_OUTCOMES" }),
    );
    expect(() =>
      priceOverUnderMarket({
        marketType: "OVER_UNDER",
        eventCode: "COUNT",
        context: CONTEXT,
        lambda: 1,
        line: 1,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "INTEGER_LINE_UNSUPPORTED" }),
    );
  });
});

describe("accumulator pricing", () => {
  const selections: AccumulatorSelection[] = [
    {
      selectionId: "kiss-yes",
      marketId: "market-kiss",
      outcomeCode: "YES",
      eventCode: "KISS",
      fairProbability: 0.6,
      displayedOdds: 1.54,
      marketStatus: "OPEN",
      outcomeStatus: "OPEN",
      stronglyDependentWithEventCodes: ["SLEEP_SAME_BED"],
      contradictsSelectionIds: [],
    },
    {
      selectionId: "sleep-yes",
      marketId: "market-sleep",
      outcomeCode: "YES",
      eventCode: "SLEEP_SAME_BED",
      fairProbability: 0.5,
      displayedOdds: 1.85,
      marketStatus: "OPEN",
      outcomeStatus: "OPEN",
      stronglyDependentWithEventCodes: ["KISS"],
      contradictsSelectionIds: [],
    },
  ];

  it("applies the explicit correlation to fair probabilities and margin only once", () => {
    const correlated = priceAccumulator({
      selections,
      correlationRules: INITIAL_CORRELATION_RULES,
      margin: 1.08,
      minimumDisplayedOdds: 1.05,
      maximumDisplayedOdds: 50,
    });

    expect(correlated.independentFairProbability).toBeCloseTo(0.3, 12);
    expect(correlated.correlationAdjustment).toBe(1.3);
    expect(correlated.combinedFairProbability).toBeCloseTo(0.39, 12);
    expect(correlated.displayedOdds).toBeCloseTo(2.37, 2);
    expect(correlated.naiveDisplayedOddsProduct).toBeCloseTo(1.54 * 1.85, 12);
  });

  it("requires a rule for strong dependency", () => {
    expect(() =>
      priceAccumulator({
        selections,
        correlationRules: [],
        margin: 1.08,
        minimumDisplayedOdds: 1.05,
        maximumDisplayedOdds: 50,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "MISSING_CORRELATION_RULE" }),
    );
  });

  it("rejects same-market, contradictory, losing and oversized combinations", () => {
    expect(() =>
      priceAccumulator({
        selections: [
          selections[0]!,
          { ...selections[1]!, marketId: "market-kiss" },
        ],
        correlationRules: INITIAL_CORRELATION_RULES,
        margin: 1.08,
        minimumDisplayedOdds: 1.05,
        maximumDisplayedOdds: 50,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ACCUMULATOR" }));
    expect(() =>
      priceAccumulator({
        selections: [
          { ...selections[0]!, contradictsSelectionIds: ["sleep-yes"] },
          selections[1]!,
        ],
        correlationRules: INITIAL_CORRELATION_RULES,
        margin: 1.08,
        minimumDisplayedOdds: 1.05,
        maximumDisplayedOdds: 50,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ACCUMULATOR" }));
    expect(() =>
      priceAccumulator({
        selections: [
          selections[0]!,
          { ...selections[1]!, outcomeStatus: "LOST" },
        ],
        correlationRules: INITIAL_CORRELATION_RULES,
        margin: 1.08,
        minimumDisplayedOdds: 1.05,
        maximumDisplayedOdds: 50,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ACCUMULATOR" }));
    expect(() =>
      priceAccumulator({
        selections: [
          selections[0]!,
          selections[1]!,
          selections[0]!,
          selections[1]!,
        ],
        correlationRules: INITIAL_CORRELATION_RULES,
        margin: 1.08,
        minimumDisplayedOdds: 1.05,
        maximumDisplayedOdds: 50,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ACCUMULATOR" }));
  });
});
