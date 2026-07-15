import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { EmptyState } from "@/components/states/empty-state";
import { listSeasonLeaderboard } from "@/data/supabase/leaderboard/leaderboard-repository";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const season = await requireSportsbookSeason();
  const rows = await listSeasonLeaderboard(season.id);
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Classement réel
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Performance MKB
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Seuls le capital et les agrégats financiers sont partagés. Les
          transactions détaillées restent privées.
        </p>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title="Classement vide"
          description="Aucun portefeuille joueur actif dans cette saison."
        />
      ) : (
        <div
          aria-label="Tableau du classement défilable"
          className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white"
          role="region"
          tabIndex={0}
        >
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">
              Classement des joueurs par capital MKB fictif
            </caption>
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3" scope="col">
                  Rang
                </th>
                <th className="px-4 py-3" scope="col">
                  Joueur
                </th>
                <th className="px-4 py-3" scope="col">
                  Capital
                </th>
                <th className="px-4 py-3" scope="col">
                  Total misé
                </th>
                <th className="px-4 py-3" scope="col">
                  Total retourné
                </th>
                <th className="px-4 py-3" scope="col">
                  Bénéfice net
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-[var(--border)]" key={row.rank}>
                  <td className="px-4 py-3 font-black">#{row.rank}</td>
                  <td className="px-4 py-3 font-bold">{row.playerName}</td>
                  <td className="px-4 py-3">{row.capitalMkb} MKB</td>
                  <td className="px-4 py-3">{row.totalStakedMkb ?? 0}</td>
                  <td className="px-4 py-3">{row.totalReturnedMkb ?? 0}</td>
                  <td className="px-4 py-3">{row.netProfitMkb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-[var(--text-muted)]">
        Taux de réussite, cote moyenne et statistiques par catégorie seront
        disponibles après le règlement des marchés.
      </p>
    </div>
  );
}
