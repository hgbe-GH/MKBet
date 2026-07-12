import Link from "next/link";

import { ActivityFeed } from "@/components/sportsbook/activity-feed";
import { LeaderboardPreview } from "@/components/sportsbook/leaderboard-preview";
import { MarketCard } from "@/components/sportsbook/market-card";
import { RechuteMeter } from "@/components/sportsbook/rechute-meter";
import { WalletSummary } from "@/components/sportsbook/wallet-summary";
import { Button } from "@/components/ui/button";
import {
  demoLeaderboard,
  demoMarkets,
  demoSeasonContext,
  demoTimeline,
} from "@/fixtures/sportsbook/demo-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-[var(--brand-active)] p-6 text-white shadow-[0_18px_50px_rgba(95,17,17,0.2)]">
        <p className="text-xs font-black tracking-[0.14em] text-red-200 uppercase">
          Données de démonstration
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">
          {demoSeasonContext.matchup}
        </h1>
        <p className="mt-3 max-w-2xl text-red-100">
          J+{demoSeasonContext.daysSinceBreakup} depuis la rupture. Les marchés
          observent une zone diplomatique instable, sans argent réel.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <RechuteMeter snapshot={demoSeasonContext.rechute} />
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Marché à la une</h2>
              <Button asChild variant="outline">
                <Link href="/markets">Tous les marchés</Link>
              </Button>
            </div>
            <MarketCard market={demoMarkets[0]} />
          </section>
        </div>
        <div className="space-y-5">
          <WalletSummary balanceMkb={demoSeasonContext.balanceMkb} />
          <ActivityFeed events={demoTimeline.slice(0, 3)} />
          <LeaderboardPreview rows={demoLeaderboard} />
        </div>
      </div>
    </div>
  );
}
