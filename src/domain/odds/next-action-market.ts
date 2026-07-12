import { validateMarketPricingContext } from "./context";
import { OddsDomainError } from "./errors";
import { buildMarketPricingResult } from "./explanations";
import { priceMultiOutcomes } from "./pricing";
import type { MarketPricingResult, NextActionPricingInput } from "./types";

export function priceNextActionMarket(
  input: NextActionPricingInput,
): MarketPricingResult {
  validateMarketPricingContext(input.context, true);
  if (!input.candidates.some(({ code }) => code === "NONE")) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "L'issue NONE est obligatoire.",
    );
  }
  const confirmed = new Set(input.confirmedEventCodes);
  const eligible = input.candidates.filter(
    (candidate) =>
      candidate.available &&
      candidate.requiredConfirmedEventCodes.every((code) =>
        confirmed.has(code),
      ) &&
      candidate.excludedWhenConfirmedEventCodes.every(
        (code) => !confirmed.has(code),
      ),
  );
  if (!eligible.some(({ code }) => code === "NONE")) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "L'issue NONE doit rester disponible.",
    );
  }

  const weights = eligible.map((candidate) => {
    if (
      !Number.isFinite(candidate.baseWeight) ||
      candidate.baseWeight < 0 ||
      !Number.isFinite(candidate.contextMultiplier) ||
      candidate.contextMultiplier <= 0
    ) {
      throw new OddsDomainError(
        "INVALID_MARKET_OUTCOMES",
        "Le poids d'une action est invalide.",
        {
          candidateCode: candidate.code,
        },
      );
    }
    let weight = candidate.baseWeight;
    for (const modifier of [...candidate.modifiers].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (!Number.isFinite(modifier.value)) {
        throw new OddsDomainError(
          "INVALID_MODIFIER",
          "Le modificateur de poids doit être fini.",
        );
      }
      if (modifier.type === "WEIGHT_MULTIPLIER") {
        if (modifier.value <= 0) {
          throw new OddsDomainError(
            "INVALID_MODIFIER",
            "Le multiplicateur de poids doit être positif.",
          );
        }
        weight *= modifier.value;
      } else {
        weight += modifier.value;
      }
    }
    weight *= candidate.contextMultiplier;
    if (weight < 0) {
      throw new OddsDomainError(
        "INVALID_MARKET_OUTCOMES",
        "Le poids final ne peut pas être négatif.",
      );
    }
    return {
      code: candidate.code,
      label: candidate.label,
      probability: weight,
    };
  });
  const pricing = priceMultiOutcomes(weights, input.context);

  return buildMarketPricingResult({
    marketType: input.marketType,
    eventCode: input.eventCode,
    context: input.context,
    model: null,
    appliedModel: null,
    fairOutcomes: pricing.fairOutcomes,
    pricedOutcomes: pricing.pricedOutcomes,
    inputSnapshot: {
      confirmedEventCodes: [...input.confirmedEventCodes],
      eligibleCandidateCodes: eligible.map(({ code }) => code),
      rawWeights: Object.fromEntries(
        weights.map(({ code, probability }) => [code, probability]),
      ),
    },
    adjustments: ["next-action:weights-normalized"],
    warnings: ["Modèle ludique configurable, sans prétention scientifique."],
  });
}
