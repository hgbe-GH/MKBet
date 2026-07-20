import Link from "next/link";

import { cn } from "@/lib/utils";

interface SegmentedFilterItem {
  active: boolean;
  href: string;
  label: string;
}

export function SegmentedFilter({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: SegmentedFilterItem[];
}) {
  return (
    <nav aria-label={ariaLabel} className="mk-segmented-filter">
      {items.map((item) => (
        <Link
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "mk-segment min-h-11",
            item.active && "mk-segment-active",
          )}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
