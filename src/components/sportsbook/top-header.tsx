import { TopNav } from "@astryxdesign/core/TopNav";

import { AccountMenu } from "@/components/sportsbook/account-menu";
import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";

export function TopHeader({ season }: { season: SportsbookSeasonContext }) {
  return (
    <TopNav
      endContent={
        <div className="flex items-center gap-2 sm:gap-4">
          <p
            aria-label={`Solde : ${season.balanceMkb.toLocaleString("fr-FR")} MKB`}
            className="text-sm font-bold tabular-nums"
          >
            {season.balanceMkb.toLocaleString("fr-FR")} MKB
          </p>
          <AccountMenu seasonTitle={season.title} roles={season.roles} />
        </div>
      }
      label="Navigation supérieure"
    />
  );
}
