import { z } from "zod";

import { DATABASE_ENUM_VALUES } from "@/domain/database/enums";
import type {
  MarketCategoryFilter,
  MarketStatusFilter,
} from "@/fixtures/sportsbook/types";

import { getUtcWeekStart } from "./market-calendar";

const categoryValues = [
  "ALL",
  ...DATABASE_ENUM_VALUES.market_category,
] as const;
const statusValues = ["ALL", "OPEN", "SUSPENDED", "CLOSED"] as const;

const querySchema = z.object({
  week: z.string().catch(""),
  category: z.enum(categoryValues).catch("ALL"),
  status: z.enum(statusValues).catch("ALL"),
});

export interface ParsedMarketCalendarSearchParams {
  weekStart: Date;
  category: MarketCategoryFilter;
  status: MarketStatusFilter;
}

type CalendarSearchParam = string | string[] | undefined;

function firstValue(value: CalendarSearchParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseUtcWeek(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function parseMarketCalendarSearchParams(
  input: Record<string, CalendarSearchParam>,
  now: Date = new Date(),
): ParsedMarketCalendarSearchParams {
  const parsed = querySchema.parse({
    week: firstValue(input.week),
    category: firstValue(input.category),
    status: firstValue(input.status),
  });
  const requestedWeek = parseUtcWeek(parsed.week);

  return {
    weekStart: getUtcWeekStart(requestedWeek ?? now),
    category: parsed.category,
    status: parsed.status,
  };
}
