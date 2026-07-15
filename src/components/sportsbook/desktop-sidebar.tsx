"use client";

import { sportsbookNavigation } from "@/application/sportsbook/navigation";
import { NavigationLink } from "@/components/sportsbook/navigation-link";

export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-white/10 bg-black/20 p-4 backdrop-blur-xl lg:block">
      <div className="mb-8 px-2 pt-2">
        <p className="text-xl font-black tracking-[-0.07em]">
          MK<span className="text-[var(--brand)]">BET</span>
        </p>
        <p className="mt-1 text-[0.64rem] font-bold tracking-[0.08em] text-[var(--text-muted)] uppercase">
          Margot × Kévin
        </p>
      </div>
      <nav aria-label="Navigation principale" className="mk-sidebar grid gap-1">
        {sportsbookNavigation.map((item) => (
          <NavigationLink
            href={item.href}
            icon={item.icon}
            key={item.href}
            label={item.label}
          />
        ))}
      </nav>
    </aside>
  );
}
