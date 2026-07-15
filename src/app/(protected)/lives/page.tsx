import { EmptyState } from "@/components/states/empty-state";
import { LiveCard } from "@/components/sportsbook/live-card";
import Image from "next/image";
import { listSeasonMedia } from "@/data/supabase/media/repository";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { listSeasonLives } from "@/data/supabase/lives/repository";

export const dynamic = "force-dynamic";

export default async function LivesPage() {
  const season = await requireSportsbookSeason();
  const [lives, media] = await Promise.all([
    listSeasonLives(season.id),
    listSeasonMedia(season.id),
  ]);
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
      {media.filter((item) => item.status === "APPROVED").length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black">Médias de la saison</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {media
              .filter((item) => item.status === "APPROVED")
              .map((item) => (
                <figure
                  className="overflow-hidden rounded-lg border border-[var(--border)] bg-white"
                  key={item.id}
                >
                  <Image
                    alt={item.caption ?? "Média de saison"}
                    className="aspect-[4/5] w-full object-cover"
                    height={800}
                    src={`/api/media/${item.id}`}
                    unoptimized
                    width={640}
                  />
                  <figcaption className="p-3 text-sm">
                    {item.caption ?? "Média de saison"}
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
