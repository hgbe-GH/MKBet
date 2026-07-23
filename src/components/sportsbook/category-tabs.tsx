"use client";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { useState } from "react";

import type {
  MarketCategoryFilter,
  MarketSort,
  MarketStatusFilter,
} from "@/fixtures/sportsbook/types";

const categories: Array<{ label: string; value: MarketCategoryFilter }> = [
  { label: "À la une", value: "ALL" },
  { label: "Contact", value: "CONTACT" },
  { label: "Physique", value: "PHYSICAL" },
  { label: "Cul", value: "SEXUAL" },
  { label: "Relation", value: "RELATIONSHIP" },
  { label: "Statut", value: "STATUS" },
  { label: "Conflits", value: "CONFLICT" },
  { label: "Long terme", value: "LONG_TERM" },
];

export function CategoryTabs({
  activeCategory,
  status,
  sort,
  q,
}: {
  activeCategory: MarketCategoryFilter;
  status: MarketStatusFilter;
  sort: MarketSort;
  q: string;
}) {
  const [selection, setSelection] = useState({
    activeCategory,
    serverCategory: activeCategory,
  });
  if (selection.serverCategory !== activeCategory) {
    setSelection({ activeCategory, serverCategory: activeCategory });
  }
  const selectedCategory =
    selection.serverCategory === activeCategory
      ? selection.activeCategory
      : activeCategory;

  return (
    <div
      aria-label="Catégories de marchés"
      className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      role="navigation"
    >
      <div className="min-w-max">
        <SegmentedControl
          label="Catégories de marchés"
          onChange={(value) => {
            const category = categories.some((item) => item.value === value)
              ? (value as MarketCategoryFilter)
              : "ALL";
            setSelection({
              activeCategory: category,
              serverCategory: activeCategory,
            });
            const params = new URLSearchParams({
              category,
              status,
              sort,
            });
            if (q) params.set("q", q);
            window.location.assign(`/markets?${params.toString()}`);
          }}
          size="lg"
          value={selectedCategory}
        >
          {categories.map((category) => (
            <SegmentedControlItem
              key={category.value}
              label={category.label}
              value={category.value}
            />
          ))}
        </SegmentedControl>
      </div>
    </div>
  );
}
