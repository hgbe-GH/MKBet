import { sportsbookNavigation } from "@/application/sportsbook/navigation";
import { NavigationLink } from "@/components/sportsbook/navigation-link";

export function MobileBottomNavigation({ showAdmin }: { showAdmin: boolean }) {
  const mobileOrder = [
    "/dashboard",
    "/lives",
    "/markets",
    "/bets",
    "/settings/account",
  ];
  const items = sportsbookNavigation
    .filter((item) => item.mobile && (!item.adminOnly || showAdmin))
    .toSorted(
      (a, b) => mobileOrder.indexOf(a.href) - mobileOrder.indexOf(b.href),
    );

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] backdrop-blur lg:hidden"
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
