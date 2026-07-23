"use client";

import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";

import type {
  MarketCategoryFilter,
  MarketSort,
  MarketStatusFilter,
} from "@/fixtures/sportsbook/types";

export function MarketFilters({
  category,
  initialQuery,
  initialSort,
  initialStatus,
}: {
  category: MarketCategoryFilter;
  initialQuery: string;
  initialSort: MarketSort;
  initialStatus: MarketStatusFilter;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<MarketStatusFilter>(initialStatus);
  const [sort, setSort] = useState<MarketSort>(initialSort);

  return (
    <form action="/markets">
      <Card padding={4} variant="muted">
        <input name="category" type="hidden" value={category} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] xl:items-end">
          <TextInput
            hasClear
            htmlName="q"
            label="Rechercher"
            onChange={setQuery}
            placeholder="bisou, statut…"
            size="lg"
            value={query}
            width="100%"
          />
          <Selector
            htmlName="status"
            label="Statut"
            onChange={(value) => setStatus(value as MarketStatusFilter)}
            options={[
              { label: "Tous", value: "ALL" },
              { label: "Ouverts", value: "OPEN" },
              { label: "Suspendus", value: "SUSPENDED" },
              { label: "Clos", value: "CLOSED" },
            ]}
            size="lg"
            value={status}
            width="100%"
          />
          <Selector
            htmlName="sort"
            label="Tri"
            onChange={(value) => setSort(value as MarketSort)}
            options={[
              { label: "Par défaut", value: "popular" },
              { label: "Échéance", value: "deadline" },
              { label: "Cote", value: "odds" },
              { label: "Version", value: "movement" },
            ]}
            size="lg"
            value={sort}
            width="100%"
          />
          <Button label="Filtrer" size="lg" type="submit" variant="primary" />
        </div>
      </Card>
    </form>
  );
}
