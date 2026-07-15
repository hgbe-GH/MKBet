import { notFound } from "next/navigation";

import { getAuthClaims } from "@/auth/get-auth-claims";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { LiveForm } from "@/components/admin/live-form";
import { EmptyState } from "@/components/states/empty-state";
import { listActiveSeasonMembers } from "@/data/supabase/lives/repository";

export const dynamic = "force-dynamic";

export default async function NewLivePage() {
  const [season, claims] = await Promise.all([
    requireSportsbookSeason(),
    getAuthClaims(),
  ]);
  if (!claims) notFound();
  const canAssignHost = season.roles.includes("ADMIN");
  const isLiveHost = season.roles.includes("LIVE_HOST");
  if (!canAssignHost && !isLiveHost) notFound();
  const members = await listActiveSeasonMembers(season.id);
  const availableHosts = members.filter((member) =>
    member.roles.includes("LIVE_HOST"),
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Créer un live
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Les horaires saisis sont en UTC. Le lancement opérationnel reste une
          étape distincte.
        </p>
      </header>
      {availableHosts.length ? (
        <LiveForm
          canAssignHost={canAssignHost}
          currentUserId={claims.userId}
          members={members}
          seasonId={season.id}
        />
      ) : (
        <EmptyState
          description="Un membre actif doit d’abord disposer du rôle LIVE_HOST."
          title="Aucun hôte éligible"
        />
      )}
    </div>
  );
}
