// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { INITIAL_CORRELATION_RULES } from "@/fixtures/odds/initial-models";

const root = process.cwd();
const migrationPath = path.join(
  root,
  "supabase/migrations/20260712120000_transactional_betting.sql",
);

function readMigration(): string {
  expect(existsSync(migrationPath)).toBe(true);
  return existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
}

describe("transactional betting PostgreSQL contract", () => {
  it("adds quotes, correlation rules, RLS and transaction-only RPCs", () => {
    const sql = readMigration();

    expect(sql).toContain("create type public.bet_quote_status as enum");
    expect(sql).toContain("create table public.accumulator_correlation_rules");
    expect(sql).toContain("create table public.bet_quotes");
    expect(sql).toContain("create table public.bet_quote_legs");
    expect(sql.match(/enable row level security/gi)).toHaveLength(3);
    expect(sql).toContain("create or replace function public.create_bet_quote");
    expect(sql).toContain("create or replace function public.place_bet");
    expect(sql).toContain(
      "create or replace function public.open_template_binary_market",
    );
    expect(sql).toContain(
      "create or replace function public.initialize_default_season_markets",
    );
    expect(sql).toContain("for update");
    expect(sql).toContain("MISSING_CORRELATION_RULE");
    expect(sql).toContain("ODDS_CHANGED");
  });

  it("keeps the SQL math aligned with the deterministic odds formulas", () => {
    const sql = readMigration();

    expect(sql).toContain("create or replace function private.clamp_numeric");
    expect(sql).toContain("create or replace function private.elapsed_days");
    expect(sql).toContain(
      "create or replace function private.cumulative_event_probability",
    );
    expect(sql).toContain(
      "create or replace function private.conditional_event_probability",
    );
    expect(sql).toContain(
      "create or replace function private.displayed_decimal_odds",
    );
    expect(sql).toMatch(/power\(2(?:\.0)?\s*,\s*-p_elapsed_days/);
    expect(sql).toContain("greatest(1.05, least(50.00");
  });

  it("seeds the exact domain correlation sets and adjustments", () => {
    const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");

    for (const rule of INITIAL_CORRELATION_RULES) {
      const canonical = [...rule.eventCodes].sort();
      expect(seed).toContain(
        `array[${canonical.map((code) => `'${code}'`).join(", ")}]::text[]`,
      );
      expect(seed).toContain(rule.correlationAdjustment.toFixed(2));
    }
  });
});
