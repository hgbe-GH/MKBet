import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { OddsMovement } from "@/components/sportsbook/odds-movement";
import { StatusBadge } from "@/components/sportsbook/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { listCurrentUserBets } from "@/data/supabase/betting/bet-repository";
import { PageIntro } from "@/components/ui/page-intro";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

export const dynamic = "force-dynamic";

interface BetsPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function BetsPage({ searchParams }: BetsPageProps = {}) {
  const season = await requireSportsbookSeason();
  const requested = (await searchParams)?.status;
  const status =
    requested === "settled"
      ? undefined
      : requested === "all"
        ? undefined
        : "OPEN";
  const bets = await listCurrentUserBets(season.id, status);

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Mes paris"
        title="Tickets enregistrés"
        description="Les cotes de chaque sélection sont figées au placement."
      />
      <SegmentedFilter
        ariaLabel="Filtrer les tickets"
        items={[
          { href: "/bets", label: "Ouverts", active: status === "OPEN" },
          {
            href: "/bets?status=settled",
            label: "Réglés",
            active: requested === "settled",
          },
          {
            href: "/bets?status=all",
            label: "Tous",
            active: requested === "all",
          },
        ]}
      />
      {bets.length === 0 ? (
        <EmptyState
          title="Aucun ticket"
          description="Aucun pronostic ne correspond à ce filtre."
        />
      ) : (
        <div className="grid gap-4">
          {bets.map((bet) => (
            <article className="mk-surface-opaque rounded-2xl p-5" key={bet.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{bet.type}</p>
                  <h2 className="text-xl font-black">
                    {bet.stakeMkb} MKB · cote {bet.totalOdds.toFixed(2)}
                  </h2>
                </div>
                <div className="text-right">
                  <StatusBadge
                    tone={bet.status === "OPEN" ? "positive" : "muted"}
                  >
                    {bet.status}
                  </StatusBadge>
                  <p className="mt-2 text-sm font-bold text-[var(--text-secondary)]">
                    Retour potentiel {bet.potentialReturnMkb} MKB
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Ticket #{bet.id.slice(0, 8).toUpperCase()} ·{" "}
                {new Date(bet.placedAt).toLocaleString("fr-FR")}
              </p>
              <ul className="mt-4 grid gap-2">
                {bet.legs.map((leg) => (
                  <li
                    className="rounded-lg bg-white/[0.055] p-3"
                    key={`${leg.marketTitle}:${leg.outcomeLabel}`}
                  >
                    <p className="font-bold">
                      {leg.marketTitle} · {leg.outcomeLabel}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Figée {leg.oddsAtBet.toFixed(2)} · actuelle{" "}
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
      )}
    </div>
  );
}
