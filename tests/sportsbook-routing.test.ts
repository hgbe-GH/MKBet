import { describe, expect, it } from "vitest";

import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { canSeeAdminNavigation } from "@/application/sportsbook/navigation";

describe("sportsbook routing and permissions", () => {
  it("sanitizes market query parameters to safe defaults", () => {
    expect(
      parseMarketSearchParams({
        category: "PHYSICAL",
        status: "OPEN",
        sort: "deadline",
        q: " bisou ",
      }),
    ).toEqual({
      category: "PHYSICAL",
      status: "OPEN",
      sort: "deadline",
      q: "bisou",
    });

    expect(
      parseMarketSearchParams({
        category: "INVALID",
        status: "BROKEN",
        sort: "weird",
        q: "<script>",
      }),
    ).toEqual({
      category: "ALL",
      status: "ALL",
      sort: "popular",
      q: "script",
    });
  });

  it("shows admin navigation only to authorized season roles", () => {
    expect(canSeeAdminNavigation(["PLAYER"])).toBe(false);
    expect(canSeeAdminNavigation(["REPORTER"])).toBe(false);
    expect(canSeeAdminNavigation(["ADMIN"])).toBe(true);
    expect(canSeeAdminNavigation(["LIVE_HOST", "PLAYER"])).toBe(true);
  });
});
