import { clamp } from "./constants";
import { OddsDomainError } from "./errors";
import type {
  AppliedModelResult,
  AppliedModifier,
  EventProbabilityModel,
  LiveProbabilityContext,
  ProbabilityModifier,
} from "./types";
import { parseUtcTimestamp, validateProbabilityModel } from "./validation";

function assertPositiveMultiplier(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new OddsDomainError(
      "INVALID_MODIFIER",
      `${field} doit être strictement positif.`,
      {
        field,
        value: Number.isFinite(value) ? value : null,
      },
    );
  }
}

function isActive(modifier: ProbabilityModifier, asOfMs: number): boolean {
  const startsAt = modifier.effectiveFrom
    ? parseUtcTimestamp(modifier.effectiveFrom, `${modifier.id}.effectiveFrom`)
    : null;
  const expiresAt = modifier.expiresAt
    ? parseUtcTimestamp(modifier.expiresAt, `${modifier.id}.expiresAt`)
    : null;

  if (startsAt !== null && expiresAt !== null && expiresAt <= startsAt) {
    throw new OddsDomainError(
      "INVALID_MODIFIER",
      "La période du modificateur est invalide.",
      {
        modifierId: modifier.id,
      },
    );
  }

  return (
    (startsAt === null || startsAt <= asOfMs) &&
    (expiresAt === null || expiresAt > asOfMs)
  );
}

function contextMultiplier(
  model: EventProbabilityModel,
  context: LiveProbabilityContext,
): number {
  assertPositiveMultiplier(
    context.physicalContextMultiplier,
    "physicalContextMultiplier",
  );
  assertPositiveMultiplier(
    context.sentimentalContextMultiplier,
    "sentimentalContextMultiplier",
  );

  if (model.family === "PHYSICAL") return context.physicalContextMultiplier;
  if (model.family === "SENTIMENTAL")
    return context.sentimentalContextMultiplier;
  return Math.sqrt(
    context.physicalContextMultiplier * context.sentimentalContextMultiplier,
  );
}

export function applyProbabilityModifiers(
  model: EventProbabilityModel,
  modifiers: readonly ProbabilityModifier[],
  asOf: string,
  liveContext?: LiveProbabilityContext,
): AppliedModelResult {
  validateProbabilityModel(model);
  const asOfMs = parseUtcTimestamp(asOf, "asOf");
  const sorted = [...modifiers].sort(
    (left, right) =>
      left.priority - right.priority || left.id.localeCompare(right.id),
  );
  const active = sorted.filter((modifier) => isActive(modifier, asOfMs));

  let qShift = 0;
  let speedMultiplier = 1;
  const appliedModifiers: AppliedModifier[] = [];

  for (const modifier of active) {
    if (
      !modifier.id ||
      !Number.isFinite(modifier.value) ||
      !Number.isInteger(modifier.priority)
    ) {
      throw new OddsDomainError(
        "INVALID_MODIFIER",
        "Le modificateur est invalide.",
      );
    }
    if (modifier.type === "SPEED_MULTIPLIER") {
      assertPositiveMultiplier(modifier.value, modifier.id);
      speedMultiplier *= modifier.value;
    } else {
      qShift += modifier.value;
    }
    appliedModifiers.push({ ...modifier, appliedAt: asOf });
  }

  if (liveContext) {
    const value = contextMultiplier(model, liveContext);
    speedMultiplier *= value;
    appliedModifiers.push({
      id: `live-context:${model.family}`,
      source: "LIVE_CONTEXT",
      description: `Contexte live ${model.family.toLowerCase()}`,
      type: "SPEED_MULTIPLIER",
      value,
      priority: Number.MAX_SAFE_INTEGER,
      metadata: { family: model.family },
      appliedAt: asOf,
    });
  }

  const unclampedQ = model.baseQ + qShift;
  const unclampedHalfLife = model.baseHalfLifeDays / speedMultiplier;
  const q = clamp(unclampedQ, model.minimumQ, model.maximumQ);
  const halfLifeDays = clamp(
    unclampedHalfLife,
    model.minimumHalfLifeDays,
    model.maximumHalfLifeDays,
  );
  const clamps: string[] = [];
  if (q !== unclampedQ)
    clamps.push(q === model.maximumQ ? "q:maximum" : "q:minimum");
  if (halfLifeDays !== unclampedHalfLife) {
    clamps.push(
      halfLifeDays === model.maximumHalfLifeDays
        ? "halfLifeDays:maximum"
        : "halfLifeDays:minimum",
    );
  }

  return {
    model: {
      eventCode: model.eventCode,
      family: model.family,
      q,
      halfLifeDays,
    },
    appliedModifiers,
    clamps,
  };
}
