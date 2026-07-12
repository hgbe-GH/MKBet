import {
  applyProbabilityModifiers,
  conditionalProbabilityForEffectiveModel,
  cumulativeEventProbability,
  priceAccumulator,
  priceBinaryOutcomes,
  type AccumulatorSelection,
  type ProbabilityModifier,
} from "@/domain/odds";

import {
  INITIAL_CORRELATION_RULES,
  INITIAL_EVENT_MODELS,
  INITIAL_MARKET_ACTION_RULES,
  fixtureRuleToProbabilityModifier,
} from "./initial-models";

const PRICING_BOUNDS = {
  margin: 1.08,
  minimumDisplayedOdds: 1.05,
  maximumDisplayedOdds: 50,
} as const;

const HORIZONS = [7, 30, 90] as const;

export const EXAMPLE_TIMELINE = {
  seasonStartAt: "2026-07-01T00:00:00.000Z",
  dayTenAsOf: "2026-07-11T00:00:00.000Z",
  dayThirtyDeadline: "2026-07-31T00:00:00.000Z",
  kissOccurredAt: "2026-07-11T00:00:00.000Z",
} as const;

interface DemoHorizon {
  readonly days: number;
  readonly probability: number;
  readonly yesOdds: number;
  readonly noOdds: number;
}

interface DemoInitialRow {
  readonly eventCode: string;
  readonly horizons: readonly DemoHorizon[];
}

interface DemoConditionalRow {
  readonly eventCode: string;
  readonly probabilityBeforeDayThirty: number;
}

interface DemoImpactRow {
  readonly eventCode: string;
  readonly beforeProbability: number;
  readonly afterProbability: number;
  readonly beforeYesOdds: number;
  readonly afterYesOdds: number;
}

export interface OddsDemoReport {
  readonly initial: readonly DemoInitialRow[];
  readonly afterTenDays: readonly DemoConditionalRow[];
  readonly afterKiss: readonly DemoImpactRow[];
  readonly accumulator: {
    readonly title: string;
    readonly naiveDisplayedOddsProduct: number;
    readonly correctDisplayedOdds: number;
    readonly independentFairProbability: number;
    readonly combinedFairProbability: number;
    readonly correlationAdjustment: number;
    readonly correlationRuleId: string | null;
  };
  readonly disclaimer: string;
}

function modifiersAfter(
  sourceEventCode: string,
  targetEventCode: string,
): ProbabilityModifier[] {
  return INITIAL_MARKET_ACTION_RULES.filter(
    (rule) =>
      rule.sourceEventCode === sourceEventCode &&
      rule.targetEventCode === targetEventCode,
  ).map((rule) =>
    fixtureRuleToProbabilityModifier(rule, EXAMPLE_TIMELINE.kissOccurredAt),
  );
}

function conditionalAtDayTen(
  eventCode: keyof typeof INITIAL_EVENT_MODELS,
): number {
  const model = INITIAL_EVENT_MODELS[eventCode];
  const effective = applyProbabilityModifiers(
    model,
    [],
    EXAMPLE_TIMELINE.dayTenAsOf,
  ).model;
  return conditionalProbabilityForEffectiveModel(effective, 10, 30);
}

export function buildOddsDemoReport(): OddsDemoReport {
  const initial = Object.values(INITIAL_EVENT_MODELS).map((model) => ({
    eventCode: model.eventCode,
    horizons: HORIZONS.map((days) => {
      const probability = cumulativeEventProbability(model, days);
      const [yes, no] = priceBinaryOutcomes(probability, PRICING_BOUNDS);
      return {
        days,
        probability,
        yesOdds: yes.displayedOdds,
        noOdds: no.displayedOdds,
      };
    }),
  }));

  const afterTenDays = Object.keys(INITIAL_EVENT_MODELS).map((eventCode) => ({
    eventCode,
    probabilityBeforeDayThirty: conditionalAtDayTen(
      eventCode as keyof typeof INITIAL_EVENT_MODELS,
    ),
  }));

  const impactedCodes = [
    "SLEEP_SAME_BED",
    "SEX",
    "SEX_FRIENDS",
    "OFFICIAL_COUPLE",
  ] as const;
  const afterKiss = impactedCodes.map((eventCode) => {
    const model = INITIAL_EVENT_MODELS[eventCode];
    const beforeProbability = conditionalAtDayTen(eventCode);
    const effective = applyProbabilityModifiers(
      model,
      modifiersAfter("KISS", eventCode),
      EXAMPLE_TIMELINE.dayTenAsOf,
    ).model;
    const afterProbability = conditionalProbabilityForEffectiveModel(
      effective,
      10,
      30,
    );
    return {
      eventCode,
      beforeProbability,
      afterProbability,
      beforeYesOdds: priceBinaryOutcomes(beforeProbability, PRICING_BOUNDS)[0]
        .displayedOdds,
      afterYesOdds: priceBinaryOutcomes(afterProbability, PRICING_BOUNDS)[0]
        .displayedOdds,
    };
  });

  const accumulatorCodes = ["KISS", "SLEEP_SAME_BED", "SEX"] as const;
  const selections: AccumulatorSelection[] = accumulatorCodes.map(
    (eventCode) => {
      const fairProbability = cumulativeEventProbability(
        INITIAL_EVENT_MODELS[eventCode],
        30,
      );
      return {
        selectionId: `${eventCode}:YES`,
        marketId: `MARKET:${eventCode}`,
        outcomeCode: "YES",
        eventCode,
        fairProbability,
        displayedOdds: priceBinaryOutcomes(fairProbability, PRICING_BOUNDS)[0]
          .displayedOdds,
        marketStatus: "OPEN",
        outcomeStatus: "OPEN",
        stronglyDependentWithEventCodes: accumulatorCodes.filter(
          (code) => code !== eventCode,
        ),
        contradictsSelectionIds: [],
      };
    },
  );
  const accumulatorPricing = priceAccumulator({
    selections,
    correlationRules: INITIAL_CORRELATION_RULES,
    ...PRICING_BOUNDS,
  });

  return {
    initial,
    afterTenDays,
    afterKiss,
    accumulator: {
      title: "Bisou + nuit ensemble + rapport avant J+30",
      naiveDisplayedOddsProduct: accumulatorPricing.naiveDisplayedOddsProduct,
      correctDisplayedOdds: accumulatorPricing.displayedOdds,
      independentFairProbability: accumulatorPricing.independentFairProbability,
      combinedFairProbability: accumulatorPricing.combinedFairProbability,
      correlationAdjustment: accumulatorPricing.correlationAdjustment,
      correlationRuleId: accumulatorPricing.correlationRuleId,
    },
    disclaimer:
      "Ces chiffres constituent un modèle ludique configurable et non une prédiction scientifique.",
  };
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)} %`;
}

function odds(value: number): string {
  return value.toFixed(2);
}

export function buildOddsMarkdownExample(): string {
  const report = buildOddsDemoReport();
  const lines = [
    "| Événement | P(J+7) | Oui / Non J+7 | P(J+30) | Oui / Non J+30 | P(J+90) | Oui / Non J+90 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.initial.map(({ eventCode, horizons }) => {
      const [day7, day30, day90] = horizons;
      return `| ${eventCode} | ${percent(day7!.probability)} | ${odds(day7!.yesOdds)} / ${odds(day7!.noOdds)} | ${percent(day30!.probability)} | ${odds(day30!.yesOdds)} / ${odds(day30!.noOdds)} | ${percent(day90!.probability)} | ${odds(day90!.yesOdds)} / ${odds(day90!.noOdds)} |`;
    }),
    "",
    `Combiné « ${report.accumulator.title} » : produit naïf des cotes **${odds(report.accumulator.naiveDisplayedOddsProduct)}**, cote corrélée **${odds(report.accumulator.correctDisplayedOdds)}** avec le coefficient **${report.accumulator.correlationAdjustment.toFixed(2)}**.`,
  ];
  return lines.join("\n");
}

export function formatOddsDemoReport(report: OddsDemoReport): string {
  const lines = ["MK Bet — démonstration déterministe du moteur de cotes", ""];
  lines.push("Situation initiale");
  for (const row of report.initial) {
    const values = row.horizons
      .map(
        ({ days, probability, yesOdds, noOdds }) =>
          `J+${days}: ${percent(probability)} (Oui ${odds(yesOdds)} / Non ${odds(noOdds)})`,
      )
      .join(" | ");
    lines.push(`${row.eventCode} — ${values}`);
  }
  lines.push("", "Après dix jours sans événement — conditionnel avant J+30");
  for (const row of report.afterTenDays) {
    lines.push(`${row.eventCode} — ${percent(row.probabilityBeforeDayThirty)}`);
  }
  lines.push("", "Après un bisou confirmé à J+10");
  for (const row of report.afterKiss) {
    lines.push(
      `${row.eventCode} — ${percent(row.beforeProbability)} → ${percent(row.afterProbability)} | cote Oui ${odds(row.beforeYesOdds)} → ${odds(row.afterYesOdds)}`,
    );
  }
  lines.push(
    "",
    `Combiné — ${report.accumulator.title}`,
    `Produit naïf des cotes: ${odds(report.accumulator.naiveDisplayedOddsProduct)}`,
    `Pricing corrélé: ${odds(report.accumulator.correctDisplayedOdds)}`,
    `Règle ${report.accumulator.correlationRuleId}: coefficient ${report.accumulator.correlationAdjustment.toFixed(2)} appliqué aux probabilités équitables, puis marge appliquée une seule fois.`,
    "",
    report.disclaimer,
  );
  return lines.join("\n");
}
