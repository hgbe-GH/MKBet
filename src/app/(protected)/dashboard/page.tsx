import Link from "next/link";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { ActivityFeed } from "@/components/sportsbook/activity-feed";
import { LeaderboardPreview } from "@/components/sportsbook/leaderboard-preview";
import { MarketCard } from "@/components/sportsbook/market-card";
import { RechuteMeter } from "@/components/sportsbook/rechute-meter";
import { WalletSummary } from "@/components/sportsbook/wallet-summary";
import { Button } from "@/components/ui/button";
import { listCurrentUserBets } from "@/data/supabase/betting/bet-repository";
import { listSeasonLeaderboard } from "@/data/supabase/leaderboard/leaderboard-repository";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";
import { demoTimeline } from "@/fixtures/sportsbook/demo-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const season = await requireSportsbookSeason();
  const [markets, bets, leaderboard] = await Promise.all([
    listSeasonMarkets(
      season.id,
      { category: "ALL", status: "OPEN", sort: "deadline", q: "" },
      3,
    ),
    listCurrentUserBets(season.id, "OPEN"),
    listSeasonLeaderboard(season.id),
  ]);
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-[var(--brand-active)] p-6 text-white shadow-[0_18px_50px_rgba(95,17,17,0.2)]">
        <p className="text-xs font-black tracking-[0.14em] text-red-200 uppercase">
          Saison réelle
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">
          {season.matchup}
        </h1>
        <p className="mt-3 max-w-2xl text-red-100">
          J+{season.daysSinceBreakup}. {markets.length} marché
          {markets.length > 1 ? "s" : ""} ouvert{markets.length > 1 ? "s" : ""},{" "}
          {bets.length} ticket{bets.length > 1 ? "s" : ""} en cours.
        </p>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <RechuteMeter snapshot={season.rechute} />
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Marché à la une</h2>
              <Button asChild variant="outline">
                <Link href="/markets">Tous les marchés</Link>
              </Button>
            </div>
            {markets[0] ? (
              <MarketCard market={markets[0]} />
            ) : (
              <p className="rounded-lg border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-secondary)]">
                Aucun marché ouvert. Le comité doit encore publier les premières
                cotes.
              </p>
            )}
          </section>
        </div>
        <div className="space-y-5">
          <Link href="/wallet">
            <WalletSummary balanceMkb={season.balanceMkb} />
          </Link>
          <LeaderboardPreview rows={leaderboard} />
          <div>
            <p className="mb-2 text-xs font-black text-amber-800 uppercase">
              Chronologie · données de démonstration
            </p>
            <ActivityFeed events={demoTimeline.slice(0, 3)} />
          </div>
        </div>
      </div>
    </div>
  );
}
