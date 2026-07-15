import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const season = await requireSportsbookSeason();
  if (!season.roles.includes("ADMIN") && !season.roles.includes("LIVE_HOST"))
    notFound();
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Console MK Bet
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Les contrôles restent autorisés par les RPC PostgreSQL, indépendamment
          de cette interface.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {season.roles.includes("ADMIN") ? (
          <Link
            className="rounded-lg border border-[var(--border)] bg-white p-5 hover:border-[var(--brand)]"
            href="/admin/markets"
          >
            <h2 className="text-xl font-black">Marchés</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Créer depuis les templates, suspendre, rouvrir ou fermer.
            </p>
          </Link>
        ) : null}
        <Link
          className="rounded-lg border border-[var(--border)] bg-white p-5 hover:border-[var(--brand)]"
          href="/admin/lives"
        >
          <h2 className="text-xl font-black">Lives</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Créer une session et préparer sa liste de participants.
          </p>
        </Link>
        {season.roles.includes("ADMIN") ? (
          <Link
            className="rounded-lg border border-[var(--border)] bg-white p-5 hover:border-[var(--brand)]"
            href="/admin/media"
          >
            <h2 className="text-xl font-black">Médias</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Téléverser et valider les photos privées.
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
