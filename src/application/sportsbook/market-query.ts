import { z } from "zod";

import { DATABASE_ENUM_VALUES } from "@/domain/database/enums";
import type {
  MarketCategoryFilter,
  MarketSort,
  MarketStatusFilter,
} from "@/fixtures/sportsbook/types";

const categoryValues = [
  "ALL",
  ...DATABASE_ENUM_VALUES.market_category,
] as const;
const statusValues = ["ALL", "OPEN", "SUSPENDED", "CLOSED"] as const;
const sortValues = ["popular", "deadline", "odds", "movement"] as const;

const querySchema = z.object({
  category: z.enum(categoryValues).catch("ALL"),
  status: z.enum(statusValues).catch("ALL"),
  sort: z.enum(sortValues).catch("popular"),
  q: z
    .string()
    .max(80)
    .transform((value) => value.replace(/[<>]/g, "").trim())
    .catch(""),
});

export interface ParsedMarketSearchParams {
  category: MarketCategoryFilter;
  status: MarketStatusFilter;
  sort: MarketSort;
  q: string;
}

export function parseMarketSearchParams(
  input: Record<string, string | string[] | undefined>,
): ParsedMarketSearchParams {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return querySchema.parse({
    category: first(input.category),
    status: first(input.status),
    sort: first(input.sort),
    q: first(input.q) ?? "",
  });
}
