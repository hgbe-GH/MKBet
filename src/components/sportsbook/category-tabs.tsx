import Link from "next/link";

import type {
  MarketCategoryFilter,
  MarketStatusFilter,
  MarketSort,
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
  return (
    <nav
      aria-label="Catégories de marchés"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
    >
      {categories.map((category) => {
        const active = category.value === activeCategory;
        const params = new URLSearchParams();
        params.set("category", category.value);
        params.set("status", status);
        params.set("sort", sort);
        if (q) {
          params.set("q", q);
        }

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 py-2 text-sm font-bold ${
              active
                ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand-hover)]"
                : "border-[var(--border)] bg-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.1] hover:text-white"
            }`}
            href={`/markets?${params.toString()}`}
            key={category.value}
          >
            {category.label}
          </Link>
        );
      })}
    </nav>
  );
}
