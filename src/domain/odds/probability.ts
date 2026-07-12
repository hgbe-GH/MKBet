import { clamp, MILLISECONDS_PER_DAY, PROBABILITY_EPSILON } from "./constants";
import { OddsDomainError } from "./errors";
import type { EffectiveProbabilityModel, EventProbabilityModel } from "./types";
import { parseUtcTimestamp, validateProbabilityModel } from "./validation";

function effectiveBaseModel(
  model: EventProbabilityModel,
): EffectiveProbabilityModel {
  validateProbabilityModel(model);

  return {
    eventCode: model.eventCode,
    family: model.family,
    q: clamp(model.baseQ, model.minimumQ, model.maximumQ),
    halfLifeDays: clamp(
      model.baseHalfLifeDays,
      model.minimumHalfLifeDays,
      model.maximumHalfLifeDays,
    ),
  };
}

export function elapsedDaysBetween(startAt: string, endAt: string): number {
  return (
    (parseUtcTimestamp(endAt, "endAt") -
      parseUtcTimestamp(startAt, "startAt")) /
    MILLISECONDS_PER_DAY
  );
}

export function cumulativeProbabilityForEffectiveModel(
  model: EffectiveProbabilityModel,
  elapsedDays: number,
): number {
  if (!Number.isFinite(elapsedDays)) {
    throw new OddsDomainError("INVALID_INTERVAL", "La durée doit être finie.");
  }

  if (elapsedDays <= 0) {
    return 0;
  }

  const probability = model.q * (1 - 2 ** (-elapsedDays / model.halfLifeDays));
  return clamp(
    Number.isFinite(probability) ? probability : model.q,
    0,
    model.q,
  );
}

export function cumulativeEventProbability(
  model: EventProbabilityModel,
  elapsedDays: number,
): number {
  return cumulativeProbabilityForEffectiveModel(
    effectiveBaseModel(model),
    elapsedDays,
  );
}

export function conditionalProbabilityForEffectiveModel(
  model: EffectiveProbabilityModel,
  currentElapsedDays: number,
  deadlineElapsedDays: number,
): number {
  if (
    !Number.isFinite(currentElapsedDays) ||
    !Number.isFinite(deadlineElapsedDays)
  ) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "Les durées conditionnelles doivent être finies.",
    );
  }
  if (currentElapsedDays < 0) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "La date de référence ne peut pas précéder le début de saison.",
    );
  }
  if (deadlineElapsedDays <= currentElapsedDays) {
    return 0;
  }

  const current = cumulativeProbabilityForEffectiveModel(
    model,
    currentElapsedDays,
  );
  const deadline = cumulativeProbabilityForEffectiveModel(
    model,
    deadlineElapsedDays,
  );
  const remainingMass = 1 - current;
  if (remainingMass <= PROBABILITY_EPSILON) {
    return 0;
  }

  return clamp((deadline - current) / remainingMass, 0, 1);
}

export function conditionalRemainingProbability(
  model: EventProbabilityModel,
  currentElapsedDays: number,
  deadlineElapsedDays: number,
): number {
  return conditionalProbabilityForEffectiveModel(
    effectiveBaseModel(model),
    currentElapsedDays,
    deadlineElapsedDays,
  );
}
