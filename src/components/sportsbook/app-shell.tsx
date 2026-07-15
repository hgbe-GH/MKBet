import type { ReactNode } from "react";

import { BetSlip } from "@/components/sportsbook/bet-slip";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { DesktopSidebar } from "@/components/sportsbook/desktop-sidebar";
import { MobileBottomNavigation } from "@/components/sportsbook/mobile-bottom-navigation";
import { MobileBetSlip } from "@/components/sportsbook/mobile-bet-slip";
import { TopHeader } from "@/components/sportsbook/top-header";
import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

interface AppShellProps {
  children: ReactNode;
  season: SportsbookSeasonContext;
}

export function AppShell({ children, season }: AppShellProps) {
  return (
    <BetSlipProvider>
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
          href="#main-content"
        >
          Aller au contenu principal
        </a>
        <div className="flex">
          <DesktopSidebar />
          <div className="min-w-0 flex-1 pb-28 lg:pb-0">
            <TopHeader season={season} />
            <div className="grid gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <main className="min-w-0" id="main-content" tabIndex={-1}>
                {children}
              </main>
              <div className="hidden xl:block">
                <div className="sticky top-20">
                  <BetSlip
                    balanceMkb={season.balanceMkb}
                    seasonId={season.id}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <MobileBetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
        <MobileBottomNavigation />
      </div>
    </BetSlipProvider>
  );
}
