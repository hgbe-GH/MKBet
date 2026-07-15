// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260712130000_live_creation.sql",
);

function readMigration(): string {
  expect(existsSync(migrationPath)).toBe(true);
  return existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
}

describe("live creation PostgreSQL contract", () => {
  it("creates an audited, idempotent RPC with a locked search path", () => {
    const sql = readMigration();

    expect(sql).toContain("create table private.live_creation_requests");
    expect(sql).toContain(
      "create or replace function public.create_live_session",
    );
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("public.write_audit_log");
    expect(sql).toContain(
      "grant execute on function public.create_live_session",
    );
  });

  it("keeps host authority individual and validates participants server-side", () => {
    const sql = readMigration();

    expect(sql).toContain("create or replace function private.is_live_host");
    expect(sql).toContain("ls.host_user_id = p_user_id");
    expect(sql).toContain("LIVE_HOST_REQUIRED");
    expect(sql).toContain("LIVE_PARTICIPANT_INVALID");
    expect(sql).toContain("LIVE_SCHEDULE_INVALID");
  });
});
