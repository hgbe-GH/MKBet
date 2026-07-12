import { OddsMovement } from "@/components/sportsbook/odds-movement";
import { listDemoBets } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
  const bets = await listDemoBets();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Mes paris
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Tickets fictifs
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Démonstration visuelle : aucun ticket n’est persisté ou réglé.
        </p>
      </header>
      <div className="flex gap-2" role="tablist">
        {["Ouverts", "Réglés", "Tous"].map((tab) => (
          <button
            className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-bold"
            disabled={tab !== "Ouverts"}
            key={tab}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {bets.map((bet) => (
          <article
            className="rounded-lg border border-[var(--border)] bg-white p-5"
            key={bet.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">{bet.type}</p>
                <h2 className="text-xl font-black">
                  {bet.stakeMkb} MKB · cote {bet.totalOdds.toFixed(2)}
                </h2>
              </div>
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                Retour potentiel {bet.potentialReturnMkb} MKB
              </p>
            </div>
            <ul className="mt-4 grid gap-2">
              {bet.legs.map((leg) => (
                <li
                  className="rounded-md bg-stone-50 p-3"
                  key={leg.marketTitle}
                >
                  <p className="font-bold">
                    {leg.marketTitle} · {leg.outcomeLabel}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Jouée {leg.oddsAtBet.toFixed(2)} · actuelle{" "}
                    {leg.currentOdds.toFixed(2)} ·{" "}
                    <OddsMovement
                      movement={
                        leg.currentOdds > leg.oddsAtBet
                          ? "UP"
                          : leg.currentOdds < leg.oddsAtBet
                            ? "DOWN"
                            : "STABLE"
                      }
                    />
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
