// @vitest-environment node

import fs from "node:fs";
import path from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { priceBinaryOutcomes, priceMultiOutcomes } from "@/domain/odds";
import {
  buildOddsDemoReport,
  buildOddsMarkdownExample,
  formatOddsDemoReport,
} from "@/fixtures/odds/example-signals";

const BOUNDS = {
  margin: 1.08,
  minimumDisplayedOdds: 1.05,
  maximumDisplayedOdds: 50,
};

describe("odds demo", () => {
  it("builds the complete deterministic scenario without external state", () => {
    const first = buildOddsDemoReport();
    const second = buildOddsDemoReport();

    expect(second).toEqual(first);
    expect(first.initial).toHaveLength(7);
    expect(first.afterTenDays).toHaveLength(7);
    expect(first.afterKiss.map(({ eventCode }) => eventCode)).toEqual([
      "SLEEP_SAME_BED",
      "SEX",
      "SEX_FRIENDS",
      "OFFICIAL_COUPLE",
    ]);
    expect(first.accumulator.correlationAdjustment).toBe(1.45);
    expect(first.accumulator.correctDisplayedOdds).not.toBe(
      first.accumulator.naiveDisplayedOddsProduct,
    );
    expect(formatOddsDemoReport(first)).toContain(
      "modèle ludique configurable",
    );
  });

  it("keeps the generated documentation example synchronized", () => {
    const oddsDocument = fs.readFileSync(
      path.join(process.cwd(), "docs/ODDS.md"),
      "utf8",
    );
    const generatedSection = oddsDocument.match(
      /<!-- odds-demo:start -->\n<!-- prettier-ignore -->\n([\s\S]*?)\n<!-- odds-demo:end -->/,
    );

    expect(generatedSection?.[1]).toBe(buildOddsMarkdownExample());
  });
});

describe("pricing properties", () => {
  it("keeps valid binary odds finite and within configured bounds", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (probability) => {
          const outcomes = priceBinaryOutcomes(probability, BOUNDS);
          for (const outcome of outcomes) {
            expect(Number.isFinite(outcome.displayedOdds)).toBe(true);
            expect(outcome.displayedOdds).toBeGreaterThanOrEqual(1.05);
            expect(outcome.displayedOdds).toBeLessThanOrEqual(50);
          }
          expect(priceBinaryOutcomes(probability, BOUNDS)).toEqual(outcomes);
        },
      ),
      { seed: 20_260_712, numRuns: 200 },
    );
  });

  it("normalizes arbitrary positive multi-outcome weights to one", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.0001, max: 1_000, noNaN: true }), {
          minLength: 2,
          maxLength: 12,
        }),
        (weights) => {
          const result = priceMultiOutcomes(
            weights.map((probability, index) => ({
              code: `OUTCOME_${index}`,
              label: `Issue ${index}`,
              probability,
            })),
            BOUNDS,
          );

          expect(
            result.fairOutcomes.reduce(
              (sum, { probability }) => sum + probability,
              0,
            ),
          ).toBeCloseTo(1, 12);
          expect(
            result.pricedOutcomes.every(({ displayedOdds }) =>
              Number.isFinite(displayedOdds),
            ),
          ).toBe(true);
        },
      ),
      { seed: 20_260_712, numRuns: 200 },
    );
  });
});
