import { sportsbookNavigation } from "@/application/sportsbook/navigation";
import { NavigationLink } from "@/components/sportsbook/navigation-link";
import { SeasonSwitcher } from "@/components/sportsbook/season-switcher";
import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

interface DesktopSidebarProps {
  season: SportsbookSeasonContext;
  showAdmin: boolean;
}

export function DesktopSidebar({ season, showAdmin }: DesktopSidebarProps) {
  const items = sportsbookNavigation.filter(
    (item) => !item.adminOnly || showAdmin,
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:block">
      <div className="mb-6">
        <p className="text-2xl font-black tracking-[-0.05em]">
          MK <span className="text-[var(--brand)]">BET</span>
        </p>
        <p className="text-xs font-bold text-[var(--text-muted)]">
          Salle des marchés privée
        </p>
      </div>
      <SeasonSwitcher currentSeason={season} seasons={[season]} />
      <nav aria-label="Navigation principale" className="mt-5 grid gap-1">
        {items.map((item) => (
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
