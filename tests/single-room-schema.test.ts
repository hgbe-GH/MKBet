import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function migration(name: string): string {
  return readFileSync(`supabase/migrations/${name}`, "utf8");
}

describe("single-room event schema", () => {
  it("defines the room, immutable votes, settlement and RLS in forward-only migrations", () => {
    const room = migration("20260715170000_single_room.sql");
    const reports = migration("20260715170001_event_reports.sql");
    const resolution = migration("20260715170002_event_resolution.sql");
    const rls = migration("20260715170003_event_reports_rls.sql");

    expect(room).toContain("ensure_single_room_membership");
    expect(reports).toContain("create table public.event_reports");
    expect(reports).toContain("unique (report_id, user_id)");
    expect(resolution).toContain("vote_event_report");
    expect(resolution).toContain("settle_event_market");
    expect(rls).toContain(
      "alter table public.event_reports enable row level security",
    );
    expect(rls).toContain("revoke all on function public.vote_event_report");
  });
});
