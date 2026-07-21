import { AppShell as AstryxAppShell } from "@astryxdesign/core/AppShell";
import { MobileNav } from "@astryxdesign/core/MobileNav";
import type { ReactNode } from "react";

import { AppNavigation } from "@/components/sportsbook/app-navigation";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
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
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-black"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <AstryxAppShell
        contentPadding={0}
        height="auto"
        mobileNav={{
          breakpoint: "lg",
          content: (
            <MobileNav header="Navigation" label="Navigation mobile">
              <AppNavigation mode="mobile" roles={season.roles} />
            </MobileNav>
          ),
        }}
        sideNav={<AppNavigation mode="desktop" roles={season.roles} />}
        topNav={<TopHeader season={season} />}
        variant="elevated"
      >
        <div className="mx-auto grid w-full max-w-[96rem] gap-6 px-4 py-5 pb-36 sm:px-6 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0" id="main-content" tabIndex={-1}>
            {children}
          </div>
          <aside aria-label="Ticket de pari" className="hidden xl:block">
            <div className="sticky top-24">
              <BetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
            </div>
          </aside>
        </div>
      </AstryxAppShell>
      <MobileBetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
    </BetSlipProvider>
  );
}
