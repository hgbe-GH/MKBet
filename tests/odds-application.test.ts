// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildMarketPricing,
  buildOddsSnapshotDraft,
  mapMarketActionRuleToModifier,
  mapMarketTemplateToModel,
  repriceMarket,
} from "@/application/odds";
import type { BinaryPricingInput } from "@/domain/odds";
import type { Market } from "@/domain/database/entities";
import type { Tables } from "@/types/database";

const TEMPLATE_ROW: Tables<"market_templates"> = {
  id: "template-kiss",
  code: "KISS_BEFORE_DATE",
  title_template: "Bisou avant une date",
  trash_title_template: "Ils craquent avant la date ?",
  market_type: "BINARY",
  category: "PHYSICAL",
  event_code: "KISS",
  default_q: 0.88,
  default_half_life_days: 14,
  default_margin: 1.08,
  settlement_rule: {},
  is_active: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const PRICING_INPUT: BinaryPricingInput = {
  marketType: "BINARY",
  eventCode: "KISS",
  model: {
    eventCode: "KISS",
    family: "PHYSICAL",
    baseQ: 0.88,
    baseHalfLifeDays: 14,
    minimumQ: 0.02,
    maximumQ: 0.98,
    minimumHalfLifeDays: 1,
    maximumHalfLifeDays: 365,
  },
  context: {
    seasonStartAt: "2026-07-01T00:00:00.000Z",
    asOf: "2026-07-11T00:00:00.000Z",
    calculatedAt: "2026-07-11T00:00:00.000Z",
    deadlineAt: "2026-07-31T00:00:00.000Z",
    margin: 1.08,
    minimumDisplayedOdds: 1.05,
    maximumDisplayedOdds: 50,
    reason: "ACTION_CONFIRMED",
    nextOddsVersion: 4,
    modifiers: [],
  },
};

describe("database-like adapters", () => {
  it("maps a generated template row without duplicating its database type", () => {
    expect(mapMarketTemplateToModel(TEMPLATE_ROW, "PHYSICAL")).toEqual(
      PRICING_INPUT.model,
    );
  });

  it("maps an active supported action rule to a temporal modifier", () => {
    const row: Tables<"market_action_rules"> = {
      id: "rule-kiss-sex",
      source_action_type_id: "action-type-kiss",
      target_event_code: "SEX",
      effect_type: "SPEED_MULTIPLIER",
      effect_value: 1.45,
      priority: 10,
      is_active: true,
      metadata: { note: "seed" },
      created_at: "2026-07-01T00:00:00.000Z",
    };

    expect(
      mapMarketActionRuleToModifier(row, {
        sourceActionCode: "KISS",
        occurredAt: "2026-07-10T20:00:00.000Z",
      }),
    ).toMatchObject({
      id: "rule-kiss-sex",
      source: "ACTION:KISS",
      type: "SPEED_MULTIPLIER",
      value: 1.45,
      effectiveFrom: "2026-07-10T20:00:00.000Z",
      metadata: {
        note: "seed",
        sourceActionCode: "KISS",
        targetEventCode: "SEX",
      },
    });
  });

  it("rejects inactive or unsupported rules", () => {
    expect(() =>
      mapMarketActionRuleToModifier(
        {
          id: "close-rule",
          source_action_type_id: "action-type",
          target_event_code: "SEX",
          effect_type: "CLOSE",
          effect_value: null,
          priority: 10,
          is_active: true,
          metadata: {},
          created_at: "2026-07-01T00:00:00.000Z",
        },
        { sourceActionCode: "KISS", occurredAt: "2026-07-10T20:00:00.000Z" },
      ),
    ).toThrowError(expect.objectContaining({ code: "INVALID_MODIFIER" }));
  });
});

describe("pricing orchestration", () => {
  it("dispatches binary pricing and preserves explicit calculation metadata", () => {
    const result = buildMarketPricing(PRICING_INPUT);

    expect(result).toMatchObject({
      marketType: "BINARY",
      eventCode: "KISS",
      oddsVersion: 4,
      calculatedAt: "2026-07-11T00:00:00.000Z",
      reason: "ACTION_CONFIRMED",
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it("builds outcome updates and snapshot inserts from supplied identifiers", () => {
    const result = buildMarketPricing(PRICING_INPUT);
    const draft = buildOddsSnapshotDraft(result, {
      marketId: "market-kiss",
      outcomes: {
        YES: { outcomeId: "outcome-yes", snapshotId: "snapshot-yes" },
        NO: { outcomeId: "outcome-no", snapshotId: "snapshot-no" },
      },
    });

    expect(draft.outcomeUpdates[0]).toMatchObject({
      id: "outcome-yes",
      market_id: "market-kiss",
      fair_probability: result.fairOutcomes[0]!.probability,
    });
    expect(draft.snapshots[0]).toMatchObject({
      id: "snapshot-yes",
      market_id: "market-kiss",
      outcome_id: "outcome-yes",
      odds_version: 4,
      calculated_at: "2026-07-11T00:00:00.000Z",
      reason: "ACTION_CONFIRMED",
    });
  });

  it("reprices only eligible markets at exactly current version plus one", () => {
    const market: Market = {
      id: "market-kiss",
      seasonId: "season-one",
      liveId: null,
      templateId: "template-kiss",
      title: "Bisou avant J+30",
      eventCode: "KISS",
      marketType: "BINARY",
      category: "PHYSICAL",
      status: "OPEN",
      opensAt: "2026-07-01T00:00:00.000Z",
      closesAt: "2026-07-31T00:00:00.000Z",
      currentQ: 0.88,
      currentHalfLifeDays: 14,
      margin: 1.08,
      oddsVersion: 3,
      settlementRule: {},
    };

    const repriced = repriceMarket({
      market,
      pricingInput: PRICING_INPUT,
      identifiers: {
        marketId: market.id,
        outcomes: {
          YES: { outcomeId: "outcome-yes", snapshotId: "snapshot-yes" },
          NO: { outcomeId: "outcome-no", snapshotId: "snapshot-no" },
        },
      },
    });

    expect(repriced.pricing.oddsVersion).toBe(4);
    expect(repriced.snapshots.snapshots).toHaveLength(2);
    expect(() =>
      repriceMarket({
        market: { ...market, status: "SETTLED" },
        pricingInput: PRICING_INPUT,
        identifiers: repriced.identifiers,
      }),
    ).toThrowError(expect.objectContaining({ code: "MARKET_NOT_REPRICEABLE" }));
    expect(() =>
      repriceMarket({
        market,
        pricingInput: {
          ...PRICING_INPUT,
          context: { ...PRICING_INPUT.context, nextOddsVersion: 5 },
        },
        identifiers: repriced.identifiers,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ODDS_VERSION" }));
  });
});
