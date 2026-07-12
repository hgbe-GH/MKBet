import { OddsDomainError } from "./errors";
import type { MarketPricingContext } from "./types";
import { parseUtcTimestamp, validatePricingBounds } from "./validation";

export function validateMarketPricingContext(
  context: MarketPricingContext,
  requireFutureDeadline: boolean,
): void {
  validatePricingBounds(context);
  const seasonStartMs = parseUtcTimestamp(
    context.seasonStartAt,
    "seasonStartAt",
  );
  const asOfMs = parseUtcTimestamp(context.asOf, "asOf");
  parseUtcTimestamp(context.calculatedAt, "calculatedAt");

  if (asOfMs < seasonStartMs) {
    throw new OddsDomainError(
      "INVALID_INTERVAL",
      "La date de référence précède le début de saison.",
    );
  }
  if (
    !Number.isInteger(context.nextOddsVersion) ||
    context.nextOddsVersion < 1
  ) {
    throw new OddsDomainError(
      "INVALID_ODDS_VERSION",
      "La version de cote doit être un entier positif.",
      {
        nextOddsVersion: context.nextOddsVersion,
      },
    );
  }
  if (!context.reason) {
    throw new OddsDomainError(
      "INVALID_MARKET_OUTCOMES",
      "La raison du calcul est obligatoire.",
    );
  }
  if (requireFutureDeadline) {
    if (!context.deadlineAt) {
      throw new OddsDomainError(
        "DEADLINE_NOT_IN_FUTURE",
        "Une échéance future est obligatoire.",
      );
    }
    const deadlineMs = parseUtcTimestamp(context.deadlineAt, "deadlineAt");
    if (deadlineMs <= asOfMs) {
      throw new OddsDomainError(
        "DEADLINE_NOT_IN_FUTURE",
        "L'échéance doit être future.",
      );
    }
  }
}
