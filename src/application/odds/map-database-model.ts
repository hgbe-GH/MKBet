import {
  OddsDomainError,
  type EventFamily,
  type EventProbabilityModel,
} from "@/domain/odds";
import type { Json, Tables } from "@/types/database";

import type {
  JsonObject,
  JsonValue,
  ProbabilityModifier,
  ProbabilityModifierType,
} from "@/domain/odds";

function sanitizeJson(value: Json | undefined): JsonValue {
  if (value === undefined) return null;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeJson(item));
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, Json] => entry[1] !== undefined)
      .map(([key, item]) => [key, sanitizeJson(item)]),
  );
}

function metadataObject(metadata: Json): JsonObject {
  const sanitized = sanitizeJson(metadata);
  if (
    sanitized !== null &&
    typeof sanitized === "object" &&
    !Array.isArray(sanitized)
  ) {
    return sanitized;
  }
  return { databaseMetadata: sanitized };
}

function isProbabilityModifierType(
  value: string,
): value is ProbabilityModifierType {
  return value === "Q_SHIFT" || value === "SPEED_MULTIPLIER";
}

export function mapMarketTemplateToModel(
  row: Tables<"market_templates">,
  family: EventFamily,
): EventProbabilityModel {
  return {
    eventCode: row.event_code,
    family,
    baseQ: row.default_q,
    baseHalfLifeDays: row.default_half_life_days,
    minimumQ: 0.02,
    maximumQ: 0.98,
    minimumHalfLifeDays: 1,
    maximumHalfLifeDays: 365,
  };
}

export function mapMarketActionRuleToModifier(
  row: Tables<"market_action_rules">,
  action: { readonly sourceActionCode: string; readonly occurredAt: string },
): ProbabilityModifier {
  if (
    !row.is_active ||
    !isProbabilityModifierType(row.effect_type) ||
    row.effect_value === null
  ) {
    throw new OddsDomainError(
      "INVALID_MODIFIER",
      "La règle de marché ne peut pas être adaptée en modificateur probabiliste.",
      { ruleId: row.id, effectType: row.effect_type, isActive: row.is_active },
    );
  }

  return {
    id: row.id,
    source: `ACTION:${action.sourceActionCode}`,
    description: `${action.sourceActionCode} agit sur ${row.target_event_code}`,
    type: row.effect_type,
    value: row.effect_value,
    priority: row.priority,
    effectiveFrom: action.occurredAt,
    metadata: {
      ...metadataObject(row.metadata),
      sourceActionCode: action.sourceActionCode,
      targetEventCode: row.target_event_code,
    },
  };
}
