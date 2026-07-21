import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { AsyncState } from "@/components/astryx/async-state";
import { PageHeading } from "@/components/astryx/page-heading";
import { GlassSurface } from "@/components/ui/glass-surface";
import { listSeasonLeaderboard } from "@/data/supabase/leaderboard/leaderboard-repository";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const season = await requireSportsbookSeason();
  const rows = await listSeasonLeaderboard(season.id);
  const podium = rows.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeading
        description="Capital et performances fictives du groupe. Les transactions détaillées restent privées."
        eyebrow="Classement réel"
        title="Performance MKB"
      />
      {rows.length === 0 ? (
        <AsyncState
          kind="empty"
          description="Aucun portefeuille joueur actif dans cette saison."
          title="Classement vide"
        />
      ) : (
        <>
          <section
            aria-label="Podium MKB"
            className="grid gap-3 sm:grid-cols-3"
          >
            {podium.map((row) => (
              <GlassSurface
                className="rounded-2xl p-5"
                key={row.rank}
                variant="subtle"
              >
                <p className="text-sm font-black text-[var(--brand-hover)]">
                  #{row.rank}
                </p>
                <h2 className="mt-3 text-xl font-black">{row.playerName}</h2>
                <p className="mt-5 text-3xl font-black tabular-nums">
                  {row.capitalMkb} <span className="text-sm">MKB</span>
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)] tabular-nums">
                  {row.netProfitMkb >= 0 ? "+" : ""}
                  {row.netProfitMkb} MKB net
                </p>
              </GlassSurface>
            ))}
          </section>
          <ol aria-label="Classement complet" className="grid gap-2">
            {rows.map((row) => (
              <li
                className="mk-surface-opaque grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-xl px-4 py-3"
                key={row.rank}
              >
                <span className="font-black text-[var(--brand-hover)]">
                  #{row.rank}
                </span>
                <span className="font-bold">{row.playerName}</span>
                <span className="text-right font-black tabular-nums">
                  {row.capitalMkb} MKB
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
