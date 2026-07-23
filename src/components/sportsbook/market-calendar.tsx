import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import Link from "next/link";

import type { MarketCalendarDay } from "@/application/sportsbook/market-calendar";
import type {
  MarketCategoryFilter,
  MarketStatusFilter,
} from "@/fixtures/sportsbook/types";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatDate(date: Date | string) {
  return dateFormatter.format(new Date(date));
}

function formatDateTime(date: string) {
  return dateTimeFormatter.format(new Date(date));
}

function toWeekParam(weekStart: Date, offset: number) {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}

function calendarHref(
  week: string,
  category: MarketCategoryFilter,
  status: MarketStatusFilter,
) {
  return `/markets/calendar?${new URLSearchParams({ week, category, status }).toString()}`;
}

export function MarketCalendarControls({
  weekStart,
  category,
  status,
}: {
  weekStart: Date;
  category: MarketCategoryFilter;
  status: MarketStatusFilter;
}) {
  const previousWeek = toWeekParam(weekStart, -1);
  const nextWeek = toWeekParam(weekStart, 1);

  return (
    <nav
      aria-label="Navigation hebdomadaire du calendrier"
      className="flex items-center justify-between gap-3"
    >
      <Link
        aria-label={`Semaine précédente : ${formatDate(previousWeek)}`}
        className="rounded-md px-3 py-2 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        href={calendarHref(previousWeek, category, status)}
      >
        Semaine précédente
      </Link>
      <Text as="p" type="supporting">
        Semaine du {formatDate(weekStart)}
      </Text>
      <Link
        aria-label={`Semaine suivante : ${formatDate(nextWeek)}`}
        className="rounded-md px-3 py-2 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        href={calendarHref(nextWeek, category, status)}
      >
        Semaine suivante
      </Link>
    </nav>
  );
}

export function MarketCalendar({ groups }: { groups: MarketCalendarDay[] }) {
  if (groups.length === 0) {
    return (
      <Text as="p" color="secondary">
        Aucun marché ne correspond à cette semaine.
      </Text>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          aria-labelledby={`calendar-day-${group.date}`}
          className="space-y-3"
          key={group.date}
        >
          <Heading id={`calendar-day-${group.date}`} level={2}>
            {formatDate(`${group.date}T00:00:00.000Z`)}
          </Heading>
          <div className="grid gap-3">
            {group.markets.map((market) => (
              <Card key={market.id} padding={4}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      label={
                        market.isClosed ? "Mises fermées" : "Mises ouvertes"
                      }
                      variant={market.isClosed ? "neutral" : "success"}
                    />
                    <Text color="secondary" type="supporting">
                      {market.category}
                    </Text>
                  </div>
                  <Link
                    aria-label={`Voir le marché ${market.title}`}
                    className="block rounded-sm text-lg font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/markets/${market.id}`}
                  >
                    {market.title}
                  </Link>
                  <dl className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-[var(--color-text-secondary)]">
                        Ouverture
                      </dt>
                      <dd>{formatDateTime(market.opensAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--color-text-secondary)]">
                        Fermeture des mises
                      </dt>
                      <dd>{formatDateTime(market.closesAt)}</dd>
                    </div>
                    {market.deadlineAt ? (
                      <div>
                        <dt className="text-[var(--color-text-secondary)]">
                          Échéance du fait
                        </dt>
                        <dd>{formatDateTime(market.deadlineAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
