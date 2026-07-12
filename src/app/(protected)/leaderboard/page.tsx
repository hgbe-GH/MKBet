import { demoLeaderboardRepository } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await demoLeaderboardRepository.listLeaderboard();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Classement
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Performance fictive
        </h1>
      </header>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
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
                Capital MKB
              </th>
              <th className="px-4 py-3" scope="col">
                Bénéfice net
              </th>
              <th className="px-4 py-3" scope="col">
                Réussite
              </th>
              <th className="px-4 py-3" scope="col">
                Badge
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-[var(--border)]" key={row.rank}>
                <td className="px-4 py-3 font-black">#{row.rank}</td>
                <td className="px-4 py-3 font-bold">{row.playerName}</td>
                <td className="px-4 py-3">{row.capitalMkb}</td>
                <td className="px-4 py-3">{row.netProfitMkb}</td>
                <td className="px-4 py-3">{row.successRate} %</td>
                <td className="px-4 py-3">{row.badge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Cote moyenne jouée",
          "Paris live",
          "Dates exactes",
          "Marchés sentimentaux",
        ].map((label) => (
          <article
            className="rounded-lg border border-[var(--border)] bg-white p-4"
            key={label}
          >
            <h2 className="text-sm font-black">{label}</h2>
            <p className="mt-2 text-2xl font-black text-[var(--brand)]">—</p>
          </article>
        ))}
      </section>
    </div>
  );
}
