// @vitest-environment node

import { describe, expect, it } from "vitest";

import { firstRpcRow } from "@/data/supabase/rpc";

describe("Supabase RPC helpers", () => {
  it("extracts the first row from table-returning RPC responses", () => {
    expect(firstRpcRow([{ season_id: "season-a" }])).toEqual({
      season_id: "season-a",
    });
    expect(firstRpcRow([])).toBeNull();
    expect(firstRpcRow(null)).toBeNull();
  });
});
