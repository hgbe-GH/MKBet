import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260712140000_private_media.sql",
);

describe("private season media migration", () => {
  it("keeps approval and archival under an administrator-only RPC", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain(
      "create or replace function public.moderate_media_asset",
    );
    expect(sql).toContain("private.has_season_role");
    expect(sql).toContain("array['admin']::public.season_member_role[]");
    expect(sql).toContain("media_asset_moderated");
  });

  it("removes direct media metadata mutation from authenticated users", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain(
      "revoke insert, update, delete on table public.media_assets from authenticated",
    );
    expect(sql).toContain(
      "create or replace function public.register_media_asset",
    );
  });

  it("prevents members from reading pending blobs directly from Storage", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain("drop policy if exists season_media_select_member");
    expect(sql).toContain("create policy season_media_select_visible_media");
    expect(sql).toContain("status = 'approved'");
  });
});
