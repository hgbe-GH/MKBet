import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { LiveCard } from "@/components/sportsbook/live-card";
import { listSeasonLives } from "@/data/supabase/lives/repository";

export const dynamic = "force-dynamic";

interface AdminLivesPageProps {
  searchParams?: Promise<{ created?: string }>;
}

export default async function AdminLivesPage({
  searchParams,
}: AdminLivesPageProps = {}) {
  const season = await requireSportsbookSeason();
  if (!season.roles.includes("ADMIN") && !season.roles.includes("LIVE_HOST"))
    notFound();
  const [lives, params] = await Promise.all([
    listSeasonLives(season.id),
    searchParams,
  ]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            Lives réels
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Les sessions sont créées, auditées et contrôlées par PostgreSQL.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/lives/new">NOUVEAU LIVE</Link>
        </Button>
      </header>
      {params?.created === "1" ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-900"
          role="status"
        >
          Live créé avec son hôte, ses participants et sa trace d’audit.
        </p>
      ) : null}
      {lives.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {lives.map((live) => (
            <LiveCard key={live.id} live={live} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Crée la première session de cette saison."
          title="Aucun live créé"
        />
      )}
    </div>
  );
}
