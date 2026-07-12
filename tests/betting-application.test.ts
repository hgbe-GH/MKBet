// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createBetQuoteSchema,
  placeBetSchema,
} from "@/application/betting/betting-schemas";
import { mapBettingErrorToMessage } from "@/application/betting/betting-errors";

describe("betting application boundaries", () => {
  it("accepts only a season, integer stake, outcome identifiers and idempotency", () => {
    const parsed = createBetQuoteSchema.parse({
      seasonId: "10000000-0000-4000-8000-000000000001",
      stakeMkb: 25,
      outcomeIds: [
        "20000000-0000-4000-8000-000000000001",
        "20000000-0000-4000-8000-000000000002",
      ],
      idempotencyKey: "30000000-0000-4000-8000-000000000001",
    });

    expect(parsed.stakeMkb).toBe(25);
    expect(Object.keys(parsed).sort()).toEqual(
      ["idempotencyKey", "outcomeIds", "seasonId", "stakeMkb"].sort(),
    );
    expect(
      createBetQuoteSchema.safeParse({ ...parsed, stakeMkb: 4 }).success,
    ).toBe(false);
    expect(
      createBetQuoteSchema.safeParse({
        ...parsed,
        outcomeIds: [...parsed.outcomeIds, parsed.outcomeIds[0]],
      }).success,
    ).toBe(false);
  });

  it("validates placement identifiers without accepting financial values", () => {
    const parsed = placeBetSchema.parse({
      quoteId: "40000000-0000-4000-8000-000000000001",
      idempotencyKey: "50000000-0000-4000-8000-000000000001",
    });

    expect(Object.keys(parsed).sort()).toEqual(
      ["idempotencyKey", "quoteId"].sort(),
    );
  });

  it("maps stable database codes to safe French copy", () => {
    expect(mapBettingErrorToMessage("ODDS_CHANGED")).toBe(
      "Les cotes ont évolué. Vérifie le nouveau ticket avant de confirmer.",
    );
    expect(mapBettingErrorToMessage("INSUFFICIENT_BALANCE")).toBe(
      "Ton capital de dignité est insuffisant pour cette mise.",
    );
    expect(mapBettingErrorToMessage("MISSING_CORRELATION_RULE")).toBe(
      "Ce combiné est trop douteux pour être coté correctement.",
    );
  });
});
