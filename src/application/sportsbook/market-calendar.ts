import type { SportsbookMarket } from "@/fixtures/sportsbook/types";

const WEEK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface CalendarMarket extends SportsbookMarket {
  operationalAt: string;
  isClosed: boolean;
}

export interface MarketCalendarDay {
  date: string;
  markets: CalendarMarket[];
}

export function getUtcWeekStart(date: Date): Date {
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) throw new RangeError("INVALID_DATE");

  const weekdayOffset = (date.getUTCDay() + 6) % 7;
  const weekStart = new Date(0);
  weekStart.setUTCFullYear(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - weekdayOffset,
  );
  return weekStart;
}

function getOperationalAt(market: SportsbookMarket): string {
  return market.deadlineAt ?? market.closesAt;
}

function toUtcDate(isoDateTime: string): string {
  return new Date(isoDateTime).toISOString().slice(0, 10);
}

export function groupMarketsByUtcDay(
  markets: readonly SportsbookMarket[],
  weekStart: Date,
  now: Date,
): MarketCalendarDay[] {
  const start = getUtcWeekStart(weekStart).getTime();
  const end = start + WEEK_DURATION_MS;
  const nowTimestamp = now.getTime();
  if (Number.isNaN(nowTimestamp)) throw new RangeError("INVALID_DATE");

  const includedMarkets = markets
    .map((market) => {
      const operationalAt = getOperationalAt(market);
      const operationalTimestamp = Date.parse(operationalAt);
      const closesAtTimestamp = Date.parse(market.closesAt);

      if (
        Number.isNaN(operationalTimestamp) ||
        Number.isNaN(closesAtTimestamp)
      ) {
        throw new RangeError("INVALID_MARKET_DATE");
      }

      return {
        calendarMarket: {
          ...market,
          operationalAt,
          isClosed:
            market.status !== "OPEN" || closesAtTimestamp <= nowTimestamp,
        },
        operationalTimestamp,
      };
    })
    .filter(
      (market) =>
        market.operationalTimestamp >= start &&
        market.operationalTimestamp < end,
    )
    .toSorted(
      (left, right) =>
        left.operationalTimestamp - right.operationalTimestamp ||
        left.calendarMarket.id.localeCompare(right.calendarMarket.id),
    );

  const grouped = new Map<string, CalendarMarket[]>();
  for (const market of includedMarkets) {
    const date = toUtcDate(market.calendarMarket.operationalAt);
    const dayMarkets = grouped.get(date) ?? [];
    dayMarkets.push(market.calendarMarket);
    grouped.set(date, dayMarkets);
  }

  return [...grouped.entries()].map(([date, dayMarkets]) => ({
    date,
    markets: dayMarkets,
  }));
}
