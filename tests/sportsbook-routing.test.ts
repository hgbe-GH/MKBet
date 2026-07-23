import { describe, expect, it } from "vitest";

import { parseMarketSearchParams } from "@/application/sportsbook/market-query";
import {
  canSeeAdministration,
  isNavigationItemActive,
  primaryNavigation,
} from "@/application/sportsbook/navigation";

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
    expect(primaryNavigation.map((item) => item.href)).toEqual([
      "/direct",
      "/markets",
      "/report",
      "/bets",
      "/leaderboard",
    ]);
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Aujourd’hui",
      "Marchés",
      "Déclarer",
      "Mes paris",
      "Classement",
    ]);
  });

  it("matches nested routes and exposes administration only to privileged roles", () => {
    expect(isNavigationItemActive("/markets", "/markets")).toBe(true);
    expect(isNavigationItemActive("/markets/kiss", "/markets")).toBe(true);
    expect(isNavigationItemActive("/leaderboard", "/markets")).toBe(false);
    expect(canSeeAdministration(["PLAYER"])).toBe(false);
    expect(canSeeAdministration(["PLAYER", "ADMIN"])).toBe(true);
    expect(canSeeAdministration(["LIVE_HOST"])).toBe(true);
  });
});
