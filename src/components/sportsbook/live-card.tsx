import Link from "next/link";

import { LiveBadge } from "@/components/sportsbook/live-badge";
import { StatusBadge } from "@/components/sportsbook/status-badge";
import type { SportsbookLive } from "@/fixtures/sportsbook/types";

export function LiveCard({ live }: { live: SportsbookLive }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        {live.status === "LIVE" ? <LiveBadge /> : null}
        <StatusBadge tone={live.status === "LIVE" ? "live" : "default"}>
          {live.status}
        </StatusBadge>
      </div>
      <h2 className="mt-3 text-xl font-black">
        <Link href={`/lives/${live.id}`}>{live.title}</Link>
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {live.type} · hôte {live.host} · {live.marketCount} marchés
      </p>
      <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm">
        {live.lastEvent}
      </p>
    </article>
  );
}
