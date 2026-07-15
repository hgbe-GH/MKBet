import { describe, expect, it } from "vitest";

import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import { sportsbookNavigation } from "@/application/sportsbook/navigation";

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

  it("keeps navigation focused on the permanent Margot and Kévin room", () => {
    expect(sportsbookNavigation.map((item) => item.href)).toEqual([
      "/direct",
      "/markets",
      "/report",
      "/bets",
      "/leaderboard",
      "/settings/account",
    ]);
    expect(
      sportsbookNavigation
        .filter((item) => item.mobile)
        .map((item) => item.href),
    ).toEqual(["/direct", "/markets", "/report", "/bets", "/leaderboard"]);
  });
});
