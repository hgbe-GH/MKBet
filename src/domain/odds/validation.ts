import { z } from "zod";

import { OddsDomainError } from "./errors";
import type { EventProbabilityModel, JsonObject, PricingBounds } from "./types";

const utcTimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/,
    "Le timestamp doit être une date ISO UTC explicite.",
  );

export function parseUtcTimestamp(value: string, field: string): number {
  const parsed = utcTimestampSchema.safeParse(value);
  const milliseconds = parsed.success ? Date.parse(parsed.data) : Number.NaN;

  if (!parsed.success || !Number.isFinite(milliseconds)) {
    throw new OddsDomainError(
      "INVALID_DATE",
      `La date ${field} est invalide.`,
      { field, value },
    );
  }

  return milliseconds;
}

export function assertFiniteNumber(
  value: number,
  code:
    | "INVALID_MARKET_OUTCOMES"
    | "INVALID_MODIFIER"
    | "INVALID_PROBABILITY_MODEL",
  field: string,
): void {
  if (!Number.isFinite(value)) {
    throw new OddsDomainError(code, `La valeur ${field} doit être finie.`, {
      field,
    });
  }
}

export function validateProbabilityModel(model: EventProbabilityModel): void {
  const values: Array<[string, number]> = [
    ["baseQ", model.baseQ],
    ["baseHalfLifeDays", model.baseHalfLifeDays],
    ["minimumQ", model.minimumQ],
    ["maximumQ", model.maximumQ],
    ["minimumHalfLifeDays", model.minimumHalfLifeDays],
    ["maximumHalfLifeDays", model.maximumHalfLifeDays],
  ];

  for (const [field, value] of values) {
    assertFiniteNumber(value, "INVALID_PROBABILITY_MODEL", field);
  }

  if (
    model.eventCode.length === 0 ||
    model.minimumQ < 0 ||
    model.maximumQ > 1 ||
    model.minimumQ > model.maximumQ ||
    model.minimumHalfLifeDays <= 0 ||
    model.minimumHalfLifeDays > model.maximumHalfLifeDays ||
    model.baseHalfLifeDays <= 0
  ) {
    throw new OddsDomainError(
      "INVALID_PROBABILITY_MODEL",
      "Le modèle probabiliste est incohérent.",
      {
        eventCode: model.eventCode,
      },
    );
  }
}

export function validatePricingBounds(bounds: PricingBounds): void {
  if (
    !Number.isFinite(bounds.margin) ||
    bounds.margin < 1 ||
    !Number.isFinite(bounds.minimumDisplayedOdds) ||
    !Number.isFinite(bounds.maximumDisplayedOdds) ||
    bounds.minimumDisplayedOdds < 1 ||
    bounds.maximumDisplayedOdds < bounds.minimumDisplayedOdds
  ) {
    throw new OddsDomainError(
      "INVALID_MARGIN",
      "La marge ou les bornes de cote sont invalides.",
      {
        margin: Number.isFinite(bounds.margin) ? bounds.margin : null,
        minimumDisplayedOdds: Number.isFinite(bounds.minimumDisplayedOdds)
          ? bounds.minimumDisplayedOdds
          : null,
        maximumDisplayedOdds: Number.isFinite(bounds.maximumDisplayedOdds)
          ? bounds.maximumDisplayedOdds
          : null,
      },
    );
  }
}

export function serializableDetails(details: JsonObject): JsonObject {
  return details;
}
