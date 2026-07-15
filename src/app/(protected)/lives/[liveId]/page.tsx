import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { EventScoreboard } from "@/components/sportsbook/event-scoreboard";
import { RechuteMeter } from "@/components/sportsbook/rechute-meter";
import { Button } from "@/components/ui/button";
import { getSeasonLive } from "@/data/supabase/lives/repository";

export const dynamic = "force-dynamic";

interface LiveDetailPageProps {
  params: Promise<{ liveId: string }>;
}

export default async function LiveDetailPage({ params }: LiveDetailPageProps) {
  const { liveId } = await params;
  const season = await requireSportsbookSeason();
  const live = await getSeasonLive(season.id, liveId);

  if (!live) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <EventScoreboard live={live} />
      <div className="grid gap-5 xl:grid-cols-2">
        <RechuteMeter snapshot={season.rechute} />
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
        <p className="rounded-lg border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-secondary)]">
          Aucun marché n’est encore associé à cette session. Leur création et
          leur ouverture seront ajoutées à une étape ultérieure.
        </p>
      </section>
    </div>
  );
}
