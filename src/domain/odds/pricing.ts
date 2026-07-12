import { clamp, roundDisplayedOdds } from "./constants";
import { OddsDomainError } from "./errors";
import type {
  FairOutcome,
  MultiOutcomePricingResult,
  PricedOutcome,
  PricingBounds,
  WeightedOutcome,
} from "./types";
import { validatePricingBounds } from "./validation";

function priceOutcome(
  outcome: FairOutcome,
  bounds: PricingBounds,
): PricedOutcome {
  const marginAdjustedProbability = outcome.probability * bounds.margin;
  const rawOddsCandidate =
    outcome.probability === 0 ? null : 1 / marginAdjustedProbability;
  const rawDisplayedOdds =
    rawOddsCandidate !== null && Number.isFinite(rawOddsCandidate)
      ? rawOddsCandidate
      : null;
  const boundedOdds = clamp(
    rawDisplayedOdds ?? bounds.maximumDisplayedOdds,
    bounds.minimumDisplayedOdds,
    bounds.maximumDisplayedOdds,
  );
  const displayedOdds = roundDisplayedOdds(boundedOdds);

  return {
    code: outcome.code,
    label: outcome.label,
    fairProbability: outcome.probability,
    marginAdjustedProbability,
    rawDisplayedOdds,
    displayedOdds,
    impliedProbabilityAfterMargin: 1 / displayedOdds,
    wasClipped: rawDisplayedOdds === null || boundedOdds !== rawDisplayedOdds,
  };
}

export function priceBinaryOutcomes(
  yesProbability: number,
  bounds: PricingBounds,
): readonly [PricedOutcome, PricedOutcome] {
  validatePricingBounds(bounds);
  if (
    !Number.isFinite(yesProbability) ||
    yesProbability < 0 ||
    yesProbability > 1
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "La probabilité binaire doit être comprise entre zéro et un.",
    );
  }

  return [
    priceOutcome(
      { code: "YES", label: "Oui", probability: yesProbability },
      bounds,
    ),
    priceOutcome(
      { code: "NO", label: "Non", probability: 1 - yesProbability },
      bounds,
    ),
  ];
}

export function priceMultiOutcomes(
  outcomes: readonly WeightedOutcome[],
  bounds: PricingBounds,
): MultiOutcomePricingResult {
  validatePricingBounds(bounds);
  if (
    outcomes.length < 2 ||
    new Set(outcomes.map(({ code }) => code)).size !== outcomes.length
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "Un marché multi-options exige au moins deux codes uniques.",
    );
  }
  if (
    outcomes.some(
      ({ code, probability }) =>
        !code || !Number.isFinite(probability) || probability < 0,
    )
  ) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "Les poids des issues doivent être finis et positifs ou nuls.",
    );
  }

  const rawSum = outcomes.reduce(
    (sum, { probability }) => sum + probability,
    0,
  );
  if (!Number.isFinite(rawSum) || rawSum <= 0) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "La somme brute des issues doit être positive.",
    );
  }

  let accumulated = 0;
  const fairOutcomes = outcomes.map(
    ({ code, label, probability }, index): FairOutcome => {
      const normalized =
        index === outcomes.length - 1 ? 1 - accumulated : probability / rawSum;
      accumulated += normalized;
      return { code, label, probability: normalized };
    },
  );

  return {
    fairOutcomes,
    pricedOutcomes: fairOutcomes.map((outcome) =>
      priceOutcome(outcome, bounds),
    ),
    normalization: {
      rawSum,
      normalizedSum: fairOutcomes.reduce(
        (sum, { probability }) => sum + probability,
        0,
      ),
      wasRequired: Math.abs(rawSum - 1) > Number.EPSILON,
    },
  };
}
