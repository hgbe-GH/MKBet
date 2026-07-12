import { notFound } from "next/navigation";

import { EventScoreboard } from "@/components/sportsbook/event-scoreboard";
import { MarketCard } from "@/components/sportsbook/market-card";
import { RechuteMeter } from "@/components/sportsbook/rechute-meter";
import { Button } from "@/components/ui/button";
import {
  demoMarkets,
  demoSeasonContext,
} from "@/fixtures/sportsbook/demo-data";
import { demoLiveRepository } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

interface LiveDetailPageProps {
  params: Promise<{ liveId: string }>;
}

export default async function LiveDetailPage({ params }: LiveDetailPageProps) {
  const { liveId } = await params;
  const live = await demoLiveRepository.getLive(liveId);

  if (!live) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <EventScoreboard live={live} />
      <div className="grid gap-5 xl:grid-cols-2">
        <RechuteMeter snapshot={demoSeasonContext.rechute} />
        <section className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h2 className="text-xl font-black">Participants</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {live.participants.join(", ")}
          </p>
          <Button className="mt-4" disabled type="button">
            SIGNALER UNE ACTION
          </Button>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            La déclaration live sera activée dans une prochaine étape.
          </p>
        </section>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-black">Marchés live</h2>
        <div className="grid gap-4">
          {demoMarkets
            .filter((market) => market.isLive)
            .map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
        </div>
      </section>
    </div>
  );
}
