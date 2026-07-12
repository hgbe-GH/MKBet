import { clamp } from "./constants";
import { OddsDomainError } from "./errors";
import { priceBinaryOutcomes } from "./pricing";
import type {
  AccumulatorPricingInput,
  AccumulatorPricingResult,
  AccumulatorSelection,
  CorrelationRule,
} from "./types";
import { validatePricingBounds } from "./validation";

function sortedEventCodes(
  selections: readonly AccumulatorSelection[],
): string[] {
  return selections
    .map(({ eventCode }) => eventCode)
    .sort((a, b) => a.localeCompare(b));
}

function findRule(
  selections: readonly AccumulatorSelection[],
  rules: readonly CorrelationRule[],
): CorrelationRule | undefined {
  const selected = sortedEventCodes(selections);
  return rules.find((rule) => {
    const ruleCodes = [...rule.eventCodes].sort((a, b) => a.localeCompare(b));
    return (
      ruleCodes.length === selected.length &&
      ruleCodes.every((code, index) => code === selected[index])
    );
  });
}

function hasStrongDependency(
  selections: readonly AccumulatorSelection[],
): boolean {
  return selections.some((selection, index) =>
    selections.some(
      (other, otherIndex) =>
        index !== otherIndex &&
        selection.stronglyDependentWithEventCodes.includes(other.eventCode),
    ),
  );
}

export function priceAccumulator(
  input: AccumulatorPricingInput,
): AccumulatorPricingResult {
  validatePricingBounds(input);
  const { selections } = input;
  if (selections.length < 2 || selections.length > 3) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Un combiné exige deux ou trois sélections.",
    );
  }
  if (
    new Set(selections.map(({ marketId }) => marketId)).size !==
    selections.length
  ) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Deux sélections du même marché sont interdites.",
    );
  }
  if (
    selections.some((selection) =>
      selection.contradictsSelectionIds.some((id) =>
        selections.some(({ selectionId }) => selectionId === id),
      ),
    )
  ) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Le combiné contient des sélections contradictoires.",
    );
  }
  if (
    selections.some(
      ({ fairProbability, displayedOdds, outcomeStatus }) =>
        !Number.isFinite(fairProbability) ||
        fairProbability <= 0 ||
        fairProbability > 1 ||
        !Number.isFinite(displayedOdds) ||
        displayedOdds < 1 ||
        ["LOST", "VOID", "REFUNDED"].includes(outcomeStatus),
    )
  ) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Une sélection est invalide ou déjà perdante.",
    );
  }

  const rule = findRule(selections, input.correlationRules);
  if (hasStrongDependency(selections) && !rule) {
    throw new OddsDomainError(
      "MISSING_CORRELATION_RULE",
      "Une règle explicite est requise pour cette dépendance forte.",
    );
  }
  if (
    selections.some(({ marketStatus }) =>
      ["VOID", "REFUNDED"].includes(marketStatus),
    ) &&
    !selections.every(
      ({ marketStatus }) =>
        !["VOID", "REFUNDED"].includes(marketStatus) ||
        rule?.allowedMarketStatuses?.includes(marketStatus),
    )
  ) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Le statut du marché interdit cette sélection.",
    );
  }
  const adjustment = rule?.correlationAdjustment ?? 1;
  if (!Number.isFinite(adjustment) || adjustment <= 0) {
    throw new OddsDomainError(
      "INVALID_ACCUMULATOR",
      "Le coefficient de corrélation est invalide.",
    );
  }

  const independentFairProbability = selections.reduce(
    (product, { fairProbability }) => product * fairProbability,
    1,
  );
  const combinedFairProbability = clamp(
    independentFairProbability * adjustment,
    0.001,
    0.95,
  );
  const priced = priceBinaryOutcomes(combinedFairProbability, input)[0];

  return {
    selections: [...selections],
    independentFairProbability,
    correlationAdjustment: adjustment,
    correlationRuleId: rule?.id ?? null,
    combinedFairProbability,
    rawDisplayedOdds: priced.rawDisplayedOdds ?? input.maximumDisplayedOdds,
    displayedOdds: priced.displayedOdds,
    naiveDisplayedOddsProduct: selections.reduce(
      (product, { displayedOdds }) => product * displayedOdds,
      1,
    ),
    explanation: {
      convention:
        "1 = indépendance; > 1 = combinaison plus probable; < 1 = moins probable",
      correlationRuleId: rule?.id ?? null,
      correlationAdjustment: adjustment,
      marginAppliedOnce: input.margin,
      probabilityClamp: [0.001, 0.95],
    },
  };
}
