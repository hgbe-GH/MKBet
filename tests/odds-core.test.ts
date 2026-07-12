// @vitest-environment node

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  OddsDomainError,
  applyProbabilityModifiers,
  conditionalRemainingProbability,
  cumulativeEventProbability,
  elapsedDaysBetween,
  priceBinaryOutcomes,
  priceMultiOutcomes,
  type EventProbabilityModel,
  type ProbabilityModifier,
} from "@/domain/odds";

const MODEL: EventProbabilityModel = {
  eventCode: "KISS",
  family: "PHYSICAL",
  baseQ: 0.88,
  baseHalfLifeDays: 14,
  minimumQ: 0.02,
  maximumQ: 0.98,
  minimumHalfLifeDays: 1,
  maximumHalfLifeDays: 365,
};

describe("odds probability core", () => {
  it("uses decimal UTC elapsed days", () => {
    expect(
      elapsedDaysBetween(
        "2026-07-12T00:00:00.000Z",
        "2026-07-13T12:00:00.000Z",
      ),
    ).toBe(1.5);
  });

  it("rejects timestamps without an explicit UTC designator", () => {
    expect(() =>
      elapsedDaysBetween("2026-07-12", "2026-07-13T00:00:00.000Z"),
    ).toThrowError(expect.objectContaining({ code: "INVALID_DATE" }));
  });

  it("implements the cumulative half-life model", () => {
    expect(cumulativeEventProbability(MODEL, 0)).toBe(0);
    expect(cumulativeEventProbability(MODEL, 14)).toBeCloseTo(0.44, 12);
    expect(cumulativeEventProbability(MODEL, 90)).toBeLessThanOrEqual(
      MODEL.baseQ,
    );
    expect(cumulativeEventProbability(MODEL, 30)).toBeGreaterThan(
      cumulativeEventProbability(MODEL, 7),
    );
  });

  it("decreases the remaining probability as time passes without an event", () => {
    const atDay5 = conditionalRemainingProbability(MODEL, 5, 30);
    const atDay15 = conditionalRemainingProbability(MODEL, 15, 30);

    expect(atDay15).toBeLessThan(atDay5);
    expect(conditionalRemainingProbability(MODEL, 30, 30)).toBe(0);
  });

  it("keeps cumulative outputs finite, bounded, monotone and deterministic", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 2_000, noNaN: true, noDefaultInfinity: true }),
        (first, second) => {
          const lower = Math.min(first, second);
          const upper = Math.max(first, second);
          const lowerProbability = cumulativeEventProbability(MODEL, lower);
          const upperProbability = cumulativeEventProbability(MODEL, upper);

          expect(Number.isFinite(lowerProbability)).toBe(true);
          expect(lowerProbability).toBeGreaterThanOrEqual(0);
          expect(upperProbability).toBeLessThanOrEqual(MODEL.maximumQ);
          expect(upperProbability).toBeGreaterThanOrEqual(lowerProbability);
          expect(cumulativeEventProbability(MODEL, lower)).toBe(
            lowerProbability,
          );
        },
      ),
      { seed: 20_260_712, numRuns: 200 },
    );
  });
});

describe("probability modifiers", () => {
  const modifiers: ProbabilityModifier[] = [
    {
      id: "speed-b",
      source: "ACTION",
      description: "Second speed modifier",
      type: "SPEED_MULTIPLIER",
      value: 2,
      priority: 20,
      metadata: {},
    },
    {
      id: "q-active",
      source: "ACTION",
      description: "Active q shift",
      type: "Q_SHIFT",
      value: 0.2,
      priority: 10,
      effectiveFrom: "2026-07-10T00:00:00.000Z",
      metadata: {},
    },
    {
      id: "speed-a",
      source: "ACTION",
      description: "First speed modifier",
      type: "SPEED_MULTIPLIER",
      value: 1.5,
      priority: 20,
      metadata: {},
    },
    {
      id: "expired",
      source: "ACTION",
      description: "Expired q shift",
      type: "Q_SHIFT",
      value: -0.5,
      priority: 1,
      expiresAt: "2026-07-11T00:00:00.000Z",
      metadata: {},
    },
  ];

  it("applies active modifiers deterministically and clamps the effective model", () => {
    const result = applyProbabilityModifiers(
      MODEL,
      modifiers,
      "2026-07-12T00:00:00.000Z",
      { physicalContextMultiplier: 1.2, sentimentalContextMultiplier: 0.5 },
    );

    expect(result.model.q).toBe(0.98);
    expect(result.model.halfLifeDays).toBeCloseTo(14 / (1.5 * 2 * 1.2), 12);
    expect(result.appliedModifiers.map(({ id }) => id)).toEqual([
      "q-active",
      "speed-a",
      "speed-b",
      "live-context:PHYSICAL",
    ]);
    expect(result.clamps).toContain("q:maximum");
  });

  it("uses only sentimental context for sentimental models and a geometric mean for mixed models", () => {
    const context = {
      physicalContextMultiplier: 4,
      sentimentalContextMultiplier: 0.25,
    };
    const sentimental = applyProbabilityModifiers(
      { ...MODEL, family: "SENTIMENTAL" },
      [],
      "2026-07-12T00:00:00.000Z",
      context,
    );
    const mixed = applyProbabilityModifiers(
      { ...MODEL, family: "MIXED" },
      [],
      "2026-07-12T00:00:00.000Z",
      context,
    );

    expect(sentimental.model.halfLifeDays).toBe(56);
    expect(mixed.model.halfLifeDays).toBe(14);
  });

  it("rejects non-positive speed multipliers", () => {
    expect(() =>
      applyProbabilityModifiers(
        MODEL,
        [{ ...modifiers[0]!, value: 0 }],
        "2026-07-12T00:00:00.000Z",
      ),
    ).toThrowError(expect.objectContaining({ code: "INVALID_MODIFIER" }));
  });
});

describe("outcome pricing", () => {
  it("keeps fair probability separate and applies margin and odds bounds", () => {
    const result = priceBinaryOutcomes(0.8, {
      margin: 1.08,
      minimumDisplayedOdds: 1.05,
      maximumDisplayedOdds: 50,
    });

    expect(result[0]).toMatchObject({
      code: "YES",
      fairProbability: 0.8,
      displayedOdds: 1.16,
    });
    expect(result[1]).toMatchObject({ code: "NO", displayedOdds: 4.63 });
    expect(result[1].fairProbability).toBeCloseTo(0.2, 12);
    expect(result[0]!.rawDisplayedOdds).toBeCloseTo(1 / (0.8 * 1.08), 12);
  });

  it("clips extreme odds without changing fair probability", () => {
    const [likely] = priceBinaryOutcomes(0.999, {
      margin: 1.08,
      minimumDisplayedOdds: 1.05,
      maximumDisplayedOdds: 50,
    });

    expect(likely).toMatchObject({
      fairProbability: 0.999,
      displayedOdds: 1.05,
      wasClipped: true,
    });
  });

  it("keeps raw odds JSON-serializable for subnormal probabilities", () => {
    const [unlikely] = priceBinaryOutcomes(Number.MIN_VALUE, {
      margin: 1.08,
      minimumDisplayedOdds: 1.05,
      maximumDisplayedOdds: 50,
    });

    expect(unlikely.rawDisplayedOdds).toBeNull();
    expect(JSON.parse(JSON.stringify(unlikely))).toEqual(unlikely);
  });

  it("normalizes multi-outcome probabilities and rejects duplicate codes", () => {
    const result = priceMultiOutcomes(
      [
        { code: "A", label: "A", probability: 2 },
        { code: "B", label: "B", probability: 3 },
      ],
      { margin: 1.08, minimumDisplayedOdds: 1.05, maximumDisplayedOdds: 50 },
    );

    expect(result.fairOutcomes.map(({ probability }) => probability)).toEqual([
      0.4, 0.6,
    ]);
    expect(result.normalization.rawSum).toBe(5);
    expect(result.normalization.normalizedSum).toBe(1);

    expect(() =>
      priceMultiOutcomes(
        [
          { code: "A", label: "A", probability: 1 },
          { code: "A", label: "Other A", probability: 1 },
        ],
        { margin: 1.08, minimumDisplayedOdds: 1.05, maximumDisplayedOdds: 50 },
      ),
    ).toThrowError(OddsDomainError);
  });
});
