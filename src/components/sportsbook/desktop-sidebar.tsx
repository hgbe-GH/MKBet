"use client";

import { sportsbookNavigation } from "@/application/sportsbook/navigation";
import { NavigationLink } from "@/components/sportsbook/navigation-link";

export function DesktopSidebar() {

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:block">
      <div className="mb-6">
        <p className="text-2xl font-black tracking-[-0.05em]">
          MK <span className="text-[var(--brand)]">BET</span>
        </p>
        <p className="text-xs font-bold text-[var(--text-muted)]">
          Margot × Kévin
        </p>
      </div>
      <div className="rounded-lg bg-[var(--brand-strong)] p-4 text-white">
        <p className="text-xs font-bold text-red-100">Salle unique</p>
        <p className="mt-1 text-lg font-black">Le groupe décide.</p>
        <p className="mt-2 text-sm leading-5 text-red-50">
          Deux votes concordants suffisent pour trancher un fait.
        </p>
      </div>
      <nav aria-label="Navigation principale" className="mt-5 grid gap-1">
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
