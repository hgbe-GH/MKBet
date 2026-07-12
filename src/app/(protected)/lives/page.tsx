import { EmptyState } from "@/components/states/empty-state";
import { LiveCard } from "@/components/sportsbook/live-card";
import { demoLiveRepository } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

export default async function LivesPage() {
  const lives = await demoLiveRepository.listLives();
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
        <p className="mt-2 text-sm font-bold text-amber-800">
          Données de démonstration · les lives réels ne sont pas encore
          développés.
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
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((live) => (
            <LiveCard key={live.id} live={live} />
          ))}
        </div>
      </section>
    </div>
  );
}
