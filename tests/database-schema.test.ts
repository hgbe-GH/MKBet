// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationDirectory = path.join(root, "supabase", "migrations");
const migrationNames = [
  "20260712100000_foundations.sql",
  "20260712100001_membership_lives_actions.sql",
  "20260712100002_markets_betting.sql",
  "20260712100003_observability.sql",
  "20260712100004_integrity_indexes_rls.sql",
] as const;

const enumValues = {
  season_status: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
  season_member_role: ["ADMIN", "LIVE_HOST", "REPORTER", "PLAYER", "SUBJECT"],
  subject_key: ["MARGOT", "KEVIN"],
  invitation_status: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
  live_status: [
    "PROPOSED",
    "SCHEDULED",
    "BETTING_OPEN",
    "ARMED",
    "LIVE",
    "SUSPENDED",
    "ENDED",
    "VERIFYING",
    "SETTLED",
    "ARCHIVED",
    "CANCELLED",
  ],
  live_type: ["PROGRAMMED", "INSTANT", "TIME_WINDOW"],
  attendance_status: ["EXPECTED", "PRESENT", "ABSENT", "LEFT", "UNKNOWN"],
  live_member_role: ["HOST", "REPORTER", "VIEWER"],
  action_status: [
    "DECLARED",
    "PENDING_CONFIRMATION",
    "CORROBORATED",
    "CONFIRMED",
    "CONTESTED",
    "REJECTED",
    "CLASSIFIED",
    "CORRECTED",
  ],
  action_certainty: [
    "RUMOR",
    "PROBABLE",
    "DIRECT_WITNESS",
    "DIRECT_INFORMATION",
    "CONFIRMED_BY_MARGOT",
    "CONFIRMED_BY_KEVIN",
    "CONFIRMED_BY_BOTH",
  ],
  confirmation_policy: [
    "ONE_REPORTER",
    "TWO_REPORTERS",
    "HOST_CONFIRMATION",
    "ONE_SUBJECT",
    "BOTH_SUBJECTS",
    "ADMIN_DECISION",
  ],
  privacy_level: [
    "PUBLIC",
    "MEMBERS_ONLY",
    "SUBJECTS_AND_ADMINS",
    "CLASSIFIED",
  ],
  confirmation_decision: [
    "CONFIRM",
    "REJECT",
    "CORRECT_TIME",
    "CLASSIFY",
    "NO_COMMENT",
  ],
  media_status: ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"],
  market_type: [
    "BINARY",
    "MULTI_OUTCOME",
    "DATE_RANGE",
    "EXACT_DATE",
    "NEXT_ACTION",
    "OVER_UNDER",
    "ACCUMULATOR",
  ],
  market_category: [
    "CONTACT",
    "PHYSICAL",
    "SEXUAL",
    "RELATIONSHIP",
    "STATUS",
    "CONFLICT",
    "LONG_TERM",
    "LIVE_SPECIAL",
  ],
  market_status: [
    "DRAFT",
    "OPEN",
    "SUSPENDED",
    "CLOSED",
    "PENDING_RESULT",
    "RESULT_DETERMINED",
    "SETTLED",
    "VOID",
    "REFUNDED",
  ],
  outcome_result_status: ["PENDING", "WINNER", "LOSER", "VOID"],
  bet_type: ["SINGLE", "ACCUMULATOR"],
  bet_status: [
    "PENDING",
    "OPEN",
    "WON",
    "LOST",
    "VOID",
    "REFUNDED",
    "PARTIALLY_SETTLED",
  ],
  bet_leg_status: ["OPEN", "WON", "LOST", "VOID"],
  settlement_type: [
    "STANDARD",
    "MANUAL",
    "VOID",
    "REFUND",
    "PARTIAL",
    "CORRECTION",
  ],
  wallet_transaction_type: [
    "INITIAL_CREDIT",
    "BET_STAKE",
    "BET_WIN",
    "BET_REFUND",
    "ADMIN_CREDIT",
    "ADMIN_DEBIT",
    "SURVIVAL_BONUS",
    "CORRECTION",
  ],
  market_effect_type: [
    "Q_SHIFT",
    "SPEED_MULTIPLIER",
    "SUSPEND",
    "CLOSE",
    "SETTLE",
    "OPEN_RELATED",
    "REPRICE",
  ],
} as const;

const actionCodes = [
  "MESSAGE_SIGNIFICANT",
  "PRIVATE_DISCUSSION",
  "MISS_YOU_DECLARATION",
  "DENIAL_PHRASE",
  "CUDDLE",
  "HAND_ON_THIGH",
  "KISS",
  "LEAVE_TOGETHER",
  "SLEEP_SAME_PLACE",
  "SLEEP_SAME_BED",
  "BLOWJOB",
  "CUNNILINGUS",
  "SEX",
  "SEX_FRIENDS",
  "EXCLUSIVITY",
  "OFFICIAL_COUPLE",
  "ARGUMENT",
  "DISTANCE",
  "NEW_EXTERNAL_RELATION",
] as const;

function readRequired(relativePath: string): string {
  const absolutePath = path.join(root, relativePath);
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function migrationSql(): string {
  return migrationNames
    .map((name) => readRequired(path.join("supabase", "migrations", name)))
    .join("\n");
}

function markedBlock(source: string, name: string): string {
  const match = source.match(
    new RegExp(`-- ${name}_BEGIN([\\s\\S]*?)-- ${name}_END`),
  );
  expect(match, `${name} block must exist`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Supabase schema source", () => {
  it("contains the five ordered migrations", () => {
    expect(migrationNames).toHaveLength(5);
    for (const migrationName of migrationNames) {
      expect(existsSync(path.join(migrationDirectory, migrationName))).toBe(
        true,
      );
    }
  });

  it("defines every PostgreSQL enum with the approved values", () => {
    const sql = migrationSql();

    for (const [enumName, values] of Object.entries(enumValues)) {
      const match = sql.match(
        new RegExp(
          `create type public\\.${enumName} as enum \\(([\\s\\S]*?)\\);`,
          "i",
        ),
      );
      expect(match, `${enumName} must be declared`).not.toBeNull();
      const actual = Array.from(
        match?.[1].matchAll(/'([A-Z_]+)'/g) ?? [],
        (value) => value[1],
      );
      expect(actual).toEqual(values);
    }
  });

  it("creates 25 private tables and enables RLS on every one", () => {
    const sql = migrationSql();
    expect(sql.match(/create table public\./gi)).toHaveLength(25);
    expect(sql.match(/enable row level security/gi)).toHaveLength(25);
  });

  it("contains immutable ledgers and cross-entity integrity checks", () => {
    const sql = migrationSql();
    expect(sql).toContain("prevent_immutable_table_mutation");
    expect(sql).toContain("validate_bet_leg_season");
    expect(sql).toContain("validate_subject_confirmation");
    expect(sql).toContain("validate_settlement_references");
    expect(sql).toContain(
      "unique (source_action_type_id, target_event_code, effect_type)",
    );
    expect(sql).toMatch(/displayed_odds[^;]+between 1\.05 and 50/i);
    expect(sql).toMatch(/default_q[^;]+between 0\.02 and 0\.98/i);
    expect(sql).toMatch(/default_half_life_days[^;]+between 1 and 365/i);
  });
});

describe("Supabase reference seed", () => {
  it("contains each action code exactly once in its canonical block", () => {
    const seed = readRequired("supabase/seed.sql");
    const codes = Array.from(
      markedBlock(seed, "ACTION_TYPES").matchAll(/\(\s*'([A-Z_]+)'/g),
      (match) => match[1],
    );
    expect(codes).toHaveLength(19);
    expect(new Set(codes).size).toBe(19);
    expect(codes).toEqual(actionCodes);
  });

  it("contains valid and unique market template parameters", () => {
    const seed = readRequired("supabase/seed.sql");
    const rows = Array.from(
      markedBlock(seed, "MARKET_TEMPLATES").matchAll(
        /\(\s*'([A-Z_]+)'[\s\S]*?,\s*(0\.\d+)\s*,\s*(\d+)\s*,\s*(1\.\d+)\s*,/g,
      ),
    );
    expect(rows).toHaveLength(7);
    expect(new Set(rows.map((row) => row[1])).size).toBe(7);
    for (const [, , q, halfLife, margin] of rows) {
      expect(Number(q)).toBeGreaterThanOrEqual(0.02);
      expect(Number(q)).toBeLessThanOrEqual(0.98);
      expect(Number(halfLife)).toBeGreaterThanOrEqual(1);
      expect(Number(halfLife)).toBeLessThanOrEqual(365);
      expect(Number(margin)).toBeGreaterThanOrEqual(1);
    }
  });

  it("contains 15 unique market impact rules", () => {
    const seed = readRequired("supabase/seed.sql");
    const rules = Array.from(
      markedBlock(seed, "MARKET_ACTION_RULES").matchAll(
        /\(\s*'([A-Z_]+)'\s*,\s*'([A-Z_]+)'\s*,\s*'([A-Z_]+)'/g,
      ),
      (match) => match.slice(1, 4).join(":"),
    );
    expect(rules).toHaveLength(15);
    expect(new Set(rules).size).toBe(15);
  });
});

describe("database TypeScript contract", () => {
  it("tracks the SQL enum values and avoids any", () => {
    const enums = readRequired("src/domain/database/enums.ts");
    const databaseTypes = readRequired("src/types/database.ts");

    for (const values of Object.values(enumValues)) {
      for (const value of values) {
        expect(enums).toContain(`\"${value}\"`);
      }
    }
    expect(databaseTypes).toContain("export type Json");
    expect(databaseTypes).toContain("export type Database");
    expect(databaseTypes).not.toMatch(/\bany\b/);
  });
});
