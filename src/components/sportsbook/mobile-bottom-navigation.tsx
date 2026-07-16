"use client";

import { sportsbookNavigation } from "@/application/sportsbook/navigation";
import { NavigationLink } from "@/components/sportsbook/navigation-link";

export function MobileBottomNavigation() {
  const mobileOrder = [
    "/direct",
    "/markets",
    "/report",
    "/bets",
    "/leaderboard",
  ];
  const items = sportsbookNavigation
    .filter((item) => item.mobile)
    .toSorted(
      (a, b) => mobileOrder.indexOf(a.href) - mobileOrder.indexOf(b.href),
    );

  return (
    <nav
      aria-label="Navigation mobile"
      className="mk-mobile-nav mk-fallback-opaque fixed inset-x-2 bottom-[max(env(safe-area-inset-bottom),0.5rem)] z-40 rounded-2xl border border-white/15 bg-white/[0.08] px-2 pb-2 pt-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.slice(0, 5).map((item) => (
          <NavigationLink
            compact
            href={item.href}
            icon={item.icon}
            key={item.href}
            label={item.label}
          />
        ))}
      </div>
    </nav>
  );
}
