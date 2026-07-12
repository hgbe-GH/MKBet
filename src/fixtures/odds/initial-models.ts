import type {
  CorrelationRule,
  EventProbabilityModel,
  ProbabilityModifier,
} from "@/domain/odds/types";

const model = (
  eventCode: string,
  baseQ: number,
  baseHalfLifeDays: number,
  family: EventProbabilityModel["family"],
): EventProbabilityModel => ({
  eventCode,
  family,
  baseQ,
  baseHalfLifeDays,
  minimumQ: 0.02,
  maximumQ: 0.98,
  minimumHalfLifeDays: 1,
  maximumHalfLifeDays: 365,
});

export const INITIAL_EVENT_MODELS = {
  KISS: model("KISS", 0.88, 14, "PHYSICAL"),
  SLEEP_SAME_BED: model("SLEEP_SAME_BED", 0.84, 18, "PHYSICAL"),
  SEX: model("SEX", 0.78, 21, "PHYSICAL"),
  BLOWJOB: model("BLOWJOB", 0.6, 30, "PHYSICAL"),
  CUNNILINGUS: model("CUNNILINGUS", 0.6, 30, "PHYSICAL"),
  SEX_FRIENDS: model("SEX_FRIENDS", 0.62, 40, "MIXED"),
  OFFICIAL_COUPLE: model("OFFICIAL_COUPLE", 0.5, 75, "SENTIMENTAL"),
} as const;

interface FixtureActionRule extends ProbabilityModifier {
  readonly sourceEventCode: string;
  readonly targetEventCode: string;
}

export function fixtureRuleToProbabilityModifier(
  rule: FixtureActionRule,
  effectiveFrom?: string,
): ProbabilityModifier {
  return {
    id: rule.id,
    source: rule.source,
    description: rule.description,
    type: rule.type,
    value: rule.value,
    priority: rule.priority,
    ...(effectiveFrom ? { effectiveFrom } : {}),
    metadata: rule.metadata,
  };
}

const actionRule = (
  sourceEventCode: string,
  targetEventCode: string,
  type: ProbabilityModifier["type"],
  value: number,
  priority: number,
): FixtureActionRule => ({
  id: `${sourceEventCode}:${targetEventCode}:${type}`,
  source: "CONFIRMED_ACTION",
  description: `${sourceEventCode} agit sur ${targetEventCode}`,
  type,
  value,
  priority,
  metadata: { sourceEventCode, targetEventCode },
  sourceEventCode,
  targetEventCode,
});

export const INITIAL_MARKET_ACTION_RULES: readonly FixtureActionRule[] = [
  actionRule("KISS", "SLEEP_SAME_BED", "SPEED_MULTIPLIER", 1.35, 10),
  actionRule("KISS", "SEX", "SPEED_MULTIPLIER", 1.45, 10),
  actionRule("KISS", "SEX_FRIENDS", "Q_SHIFT", 0.1, 10),
  actionRule("KISS", "OFFICIAL_COUPLE", "Q_SHIFT", 0.02, 10),
  actionRule("SEX", "SEX_FRIENDS", "Q_SHIFT", 0.15, 20),
  actionRule("SEX", "OFFICIAL_COUPLE", "Q_SHIFT", 0.03, 20),
  actionRule(
    "MISS_YOU_DECLARATION",
    "SLEEP_SAME_BED",
    "SPEED_MULTIPLIER",
    1.15,
    30,
  ),
  actionRule("MISS_YOU_DECLARATION", "SEX", "SPEED_MULTIPLIER", 1.1, 30),
  actionRule("ARGUMENT", "KISS", "SPEED_MULTIPLIER", 0.7, 40),
  actionRule("ARGUMENT", "SLEEP_SAME_BED", "SPEED_MULTIPLIER", 0.7, 40),
  actionRule("ARGUMENT", "SEX", "SPEED_MULTIPLIER", 0.7, 40),
  actionRule("DISTANCE", "KISS", "SPEED_MULTIPLIER", 0.65, 50),
  actionRule("DISTANCE", "SLEEP_SAME_BED", "SPEED_MULTIPLIER", 0.65, 50),
  actionRule("DISTANCE", "SEX", "SPEED_MULTIPLIER", 0.65, 50),
  actionRule("NEW_EXTERNAL_RELATION", "OFFICIAL_COUPLE", "Q_SHIFT", -0.2, 60),
];

export const INITIAL_CORRELATION_RULES: readonly CorrelationRule[] = [
  {
    id: "KISS+LEAVE_TOGETHER",
    eventCodes: ["KISS", "LEAVE_TOGETHER"],
    correlationAdjustment: 1.2,
    description: "Bisou et départ ensemble",
  },
  {
    id: "KISS+SLEEP_SAME_BED",
    eventCodes: ["KISS", "SLEEP_SAME_BED"],
    correlationAdjustment: 1.3,
    description: "Bisou et nuit ensemble",
  },
  {
    id: "KISS+SLEEP_SAME_BED+SEX",
    eventCodes: ["KISS", "SLEEP_SAME_BED", "SEX"],
    correlationAdjustment: 1.45,
    description: "Bisou, nuit ensemble et rapport",
  },
  {
    id: "SEX+SEX_FRIENDS",
    eventCodes: ["SEX", "SEX_FRIENDS"],
    correlationAdjustment: 1.35,
    description: "Rapport et relation sex-friends",
  },
  {
    id: "SEX+OFFICIAL_COUPLE",
    eventCodes: ["SEX", "OFFICIAL_COUPLE"],
    correlationAdjustment: 1.08,
    description: "Rapport et couple officiel faiblement corrélés",
  },
];
