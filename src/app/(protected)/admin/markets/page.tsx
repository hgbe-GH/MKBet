import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { InitializeMarketsButton } from "@/components/admin/initialize-markets-button";
import { MarketStatusControls } from "@/components/admin/market-status-controls";
import { Button } from "@/components/ui/button";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";
import { listRecentMarketAudit } from "@/data/supabase/markets/audit-repository";
import { getDefaultMarketSchedule } from "@/data/supabase/markets/template-repository";

export const dynamic = "force-dynamic";

interface AdminMarketsPageProps {
  searchParams?: Promise<{ created?: string }>;
}

export default async function AdminMarketsPage({
  searchParams,
}: AdminMarketsPageProps = {}) {
  const season = await requireSportsbookSeason();
  if (!season.roles.includes("ADMIN")) notFound();
  const [markets, audit, schedule] = await Promise.all([
    listSeasonMarkets(season.id, {
      category: "ALL",
      status: "ALL",
      sort: "deadline",
      q: "",
    }),
    listRecentMarketAudit(season.id),
    getDefaultMarketSchedule(season.id),
  ]);
  const marketCreated = (await searchParams)?.created === "1";
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            Marchés réels
          </h1>
        </div>
        <Button asChild>
          <Link href="/admin/markets/new">NOUVEAU MARCHÉ</Link>
        </Button>
      </header>
      {marketCreated ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-900"
          role="status"
        >
          Marché créé avec ses cotes et snapshots initiaux.
        </p>
      ) : null}
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">Initialisation rapide</h2>
        <div className="mt-3">
          <InitializeMarketsButton
            closesAt={schedule.closes_at}
            physicalDeadlineAt={schedule.physical_deadline_at}
            relationshipDeadlineAt={schedule.relationship_deadline_at}
            seasonId={season.id}
          />
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-black">Marchés de la saison</h2>
        {markets.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-white p-5 text-sm">
            Aucun marché créé.
          </p>
        ) : (
          markets.map((market) => (
            <article
              className="rounded-lg border border-[var(--border)] bg-white p-4"
              key={market.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">
                    <Link href={`/markets/${market.id}`}>{market.title}</Link>
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {market.category} · échéance{" "}
                    {new Date(market.deadline).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-black">{market.status}</p>
                  <p>
                    Version {market.oddsVersion} · {market.outcomes.length}{" "}
                    issues
                  </p>
                </div>
              </div>
              <MarketStatusControls
                marketId={market.id}
                status={market.status}
              />
            </article>
          ))
        )}
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">Audit récent</h2>
        {audit.length === 0 ? (
          <p className="mt-3 text-sm">Aucune action de marché auditée.</p>
        ) : (
          <ol className="mt-3 divide-y divide-[var(--border)]">
            {audit.map((entry) => (
              <li className="py-2 text-sm" key={entry.id}>
                <strong>{entry.action}</strong> ·{" "}
                {new Date(entry.created_at).toLocaleString("fr-FR")} · marché{" "}
                {entry.entity_id.slice(0, 8)}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
