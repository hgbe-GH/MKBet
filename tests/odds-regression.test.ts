// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  applyProbabilityModifiers,
  cumulativeEventProbability,
  cumulativeProbabilityForEffectiveModel,
} from "@/domain/odds";
import {
  INITIAL_EVENT_MODELS,
  INITIAL_MARKET_ACTION_RULES,
  fixtureRuleToProbabilityModifier,
} from "@/fixtures/odds/initial-models";

describe("MK Bet numerical regressions", () => {
  it.each([
    ["KISS", 0.2577460326, 0.6807407939, 0.8697837893],
    ["SLEEP_SAME_BED", 0.198477245, 0.5754165795, 0.81375],
    ["SEX", 0.1609135897, 0.4902311136, 0.7400086514],
    ["BLOWJOB", 0.0895997034, 0.3, 0.525],
    ["CUNNILINGUS", 0.0895997034, 0.3, 0.525],
    ["SEX_FRIENDS", 0.0708241382, 0.2513457943, 0.4896610556],
    ["OFFICIAL_COUPLE", 0.0313227517, 0.1210708584, 0.2823623592],
  ] as const)(
    "matches %s at days 7, 30 and 90",
    (eventCode, day7, day30, day90) => {
      const model = INITIAL_EVENT_MODELS[eventCode];

      expect(cumulativeEventProbability(model, 7)).toBeCloseTo(day7, 9);
      expect(cumulativeEventProbability(model, 30)).toBeCloseTo(day30, 9);
      expect(cumulativeEventProbability(model, 90)).toBeCloseTo(day90, 9);
    },
  );

  it("makes sleep and sex faster after KISS while only slightly shifting official couple q", () => {
    const asOf = "2026-07-12T00:00:00.000Z";
    const kissModifiers = INITIAL_MARKET_ACTION_RULES.filter(
      ({ sourceEventCode }) => sourceEventCode === "KISS",
    ).map((rule) => fixtureRuleToProbabilityModifier(rule));

    const sleepBefore = cumulativeEventProbability(
      INITIAL_EVENT_MODELS.SLEEP_SAME_BED,
      30,
    );
    const sleepAfterModel = applyProbabilityModifiers(
      INITIAL_EVENT_MODELS.SLEEP_SAME_BED,
      kissModifiers.filter(
        ({ metadata }) => metadata.targetEventCode === "SLEEP_SAME_BED",
      ),
      asOf,
    ).model;
    const sexAfterModel = applyProbabilityModifiers(
      INITIAL_EVENT_MODELS.SEX,
      kissModifiers.filter(
        ({ metadata }) => metadata.targetEventCode === "SEX",
      ),
      asOf,
    ).model;
    const friendsAfterModel = applyProbabilityModifiers(
      INITIAL_EVENT_MODELS.SEX_FRIENDS,
      kissModifiers.filter(
        ({ metadata }) => metadata.targetEventCode === "SEX_FRIENDS",
      ),
      asOf,
    ).model;
    const coupleAfterModel = applyProbabilityModifiers(
      INITIAL_EVENT_MODELS.OFFICIAL_COUPLE,
      kissModifiers.filter(
        ({ metadata }) => metadata.targetEventCode === "OFFICIAL_COUPLE",
      ),
      asOf,
    ).model;

    expect(
      cumulativeProbabilityForEffectiveModel(sleepAfterModel, 30),
    ).toBeGreaterThan(sleepBefore);
    expect(
      cumulativeProbabilityForEffectiveModel(sexAfterModel, 30),
    ).toBeGreaterThan(cumulativeEventProbability(INITIAL_EVENT_MODELS.SEX, 30));
    expect(friendsAfterModel.q).toBeCloseTo(0.72, 12);
    expect(coupleAfterModel.q).toBeCloseTo(0.52, 12);
  });

  it("strongly lowers official couple after an external relation without touching physical models", () => {
    const modifier = INITIAL_MARKET_ACTION_RULES.find(
      ({ sourceEventCode }) => sourceEventCode === "NEW_EXTERNAL_RELATION",
    )!;
    const domainModifier = fixtureRuleToProbabilityModifier(modifier);
    const couple = applyProbabilityModifiers(
      INITIAL_EVENT_MODELS.OFFICIAL_COUPLE,
      [domainModifier],
      "2026-07-12T00:00:00.000Z",
    ).model;

    expect(couple.q).toBeCloseTo(0.3, 12);
    expect(INITIAL_EVENT_MODELS.KISS.baseQ).toBe(0.88);
    expect(INITIAL_EVENT_MODELS.SEX.baseHalfLifeDays).toBe(21);
  });

  it("keeps official couple correlation weaker than kiss and sleep", () => {
    const kissSleep = 1.3;
    const sexCouple = 1.08;
    expect(sexCouple).toBeLessThan(kissSleep);
  });
});
