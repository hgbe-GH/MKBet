import { describe, expect, it } from "vitest";

import {
  getUtcWeekStart,
  groupMarketsByUtcDay,
} from "@/application/sportsbook/market-calendar";
import { parseMarketCalendarSearchParams } from "@/application/sportsbook/calendar-query";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";

function market(
  id: string,
  overrides: Partial<SportsbookMarket> = {},
): SportsbookMarket {
  return {
    id,
    title: id,
    description: "Marché de test.",
    category: "CONTACT",
    type: "BINARY",
    status: "OPEN",
    deadline: "2026-07-22T20:00:00.000Z",
    opensAt: "2026-07-20T12:00:00.000Z",
    closesAt: "2026-07-22T22:00:00.000Z",
    deadlineAt: "2026-07-22T20:00:00.000Z",
    betCount: 0,
    variationLabel: "Stable",
    oddsVersion: 1,
    isLive: false,
    settlementRule: "Règle de test.",
    outcomes: [],
    history: [],
    ...overrides,
  };
}

describe("market calendar", () => {
  it("converts any instant to the Monday UTC starting its week", () => {
    expect(getUtcWeekStart(new Date("2026-07-26T23:59:59.999-07:00"))).toEqual(
      new Date("2026-07-27T00:00:00.000Z"),
    );
  });

  it("defaults an invalid week to the supplied current UTC week", () => {
    expect(
      parseMarketCalendarSearchParams(
        { week: "2026-99-99", category: "NOT_A_CATEGORY", status: "INVALID" },
        new Date("2026-07-23T12:00:00.000Z"),
      ),
    ).toEqual({
      weekStart: new Date("2026-07-20T00:00:00.000Z"),
      category: "ALL",
      status: "ALL",
    });
  });

  it("uses only the first scalar value of repeated calendar query parameters", () => {
    expect(
      parseMarketCalendarSearchParams(
        {
          week: ["2026-07-20", "2026-07-27"],
          category: ["CONTACT", "PHYSICAL"],
          status: ["OPEN", "CLOSED"],
        },
        new Date("2026-07-23T12:00:00.000Z"),
      ),
    ).toEqual({
      weekStart: new Date("2026-07-20T00:00:00.000Z"),
      category: "CONTACT",
      status: "OPEN",
    });
  });

  it("includes operational dates within [week start, next week start) only", () => {
    const weekStart = new Date("2026-07-20T00:00:00.000Z");
    const groups = groupMarketsByUtcDay(
      [
        market("before", {
          deadlineAt: null,
          closesAt: "2026-07-19T23:59:59.999Z",
        }),
        market("first", { deadlineAt: "2026-07-20T00:00:00.000Z" }),
        market("last", { deadlineAt: "2026-07-26T23:59:59.999Z" }),
        market("after", { deadlineAt: "2026-07-27T00:00:00.000Z" }),
      ],
      weekStart,
      new Date("2026-07-20T10:00:00.000Z"),
    );

    expect(
      groups.flatMap((group) => group.markets.map(({ id }) => id)),
    ).toEqual(["first", "last"]);
  });

  it("orders UTC day groups and their markets chronologically", () => {
    const groups = groupMarketsByUtcDay(
      [
        market("later", { deadlineAt: "2026-07-22T20:00:00.000Z" }),
        market("early", { deadlineAt: "2026-07-20T08:00:00.000Z" }),
        market("middle", { deadlineAt: "2026-07-22T09:00:00.000Z" }),
      ],
      new Date("2026-07-20T00:00:00.000Z"),
      new Date("2026-07-20T00:00:00.000Z"),
    );

    expect(groups.map((group) => group.date)).toEqual([
      "2026-07-20",
      "2026-07-22",
    ]);
    expect(groups[1]?.markets.map(({ id }) => id)).toEqual(["middle", "later"]);
  });

  it("derives closed state from the persisted status or close time", () => {
    const groups = groupMarketsByUtcDay(
      [
        market("time-closed", {
          deadlineAt: "2026-07-21T08:00:00.000Z",
          closesAt: "2026-07-21T09:00:00.000Z",
        }),
        market("status-closed", {
          deadlineAt: "2026-07-21T08:30:00.000Z",
          status: "SUSPENDED",
        }),
        market("open", {
          deadlineAt: "2026-07-21T09:00:00.000Z",
          closesAt: "2026-07-21T11:00:00.000Z",
        }),
      ],
      new Date("2026-07-20T00:00:00.000Z"),
      new Date("2026-07-21T10:00:00.000Z"),
    );

    expect(
      groups[0]?.markets.map(({ id, isClosed }) => ({ id, isClosed })),
    ).toEqual([
      { id: "time-closed", isClosed: true },
      { id: "status-closed", isClosed: true },
      { id: "open", isClosed: false },
    ]);
  });

  it("uses deadline for its operational date without conflating it with close time", () => {
    const groups = groupMarketsByUtcDay(
      [
        market("deadline-first", {
          deadlineAt: "2026-07-21T09:00:00.000Z",
          closesAt: "2026-07-23T18:00:00.000Z",
        }),
      ],
      new Date("2026-07-20T00:00:00.000Z"),
      new Date("2026-07-21T10:00:00.000Z"),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      date: "2026-07-21",
      markets: [
        {
          id: "deadline-first",
          deadlineAt: "2026-07-21T09:00:00.000Z",
          closesAt: "2026-07-23T18:00:00.000Z",
          isClosed: false,
        },
      ],
    });
  });
});
