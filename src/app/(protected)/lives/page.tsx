import { EmptyState } from "@/components/states/empty-state";
import { LiveCard } from "@/components/sportsbook/live-card";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { listSeasonLives } from "@/data/supabase/lives/repository";

export const dynamic = "force-dynamic";

export default async function LivesPage() {
  const season = await requireSportsbookSeason();
  const lives = await listSeasonLives(season.id);
  const liveNow = lives.filter((live) => live.status === "LIVE");
  const upcoming = lives.filter((live) => live.status !== "LIVE");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Live
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Sessions en cours
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Sessions réelles de la saison {season.title}.
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-black">En direct</h2>
        {liveNow.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liveNow.map((live) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Aucun match en cours. La dignité tient encore."
            title="Aucun live"
          />
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-black">À venir et fenêtres ouvertes</h2>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((live) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Aucune session planifiée pour le moment."
            title="Aucun live à venir"
          />
        )}
      </section>
    </div>
  );
}
