import "server-only";

import { getCurrentUserDashboardSeason } from "@/data/supabase/seasons/repository";
import type { SportsbookSeasonContext } from "@/fixtures/sportsbook/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentSportsbookSeason(
  seasonId: string | null = null,
): Promise<SportsbookSeasonContext | null> {
  const season = await getCurrentUserDashboardSeason(seasonId);
  if (!season) return null;
  const supabase = await createServerSupabaseClient();
  const [{ data: seasonRow }, { data: rechute }] = await Promise.all([
    supabase
      .from("seasons")
      .select("status,started_at")
      .eq("id", season.id)
      .maybeSingle(),
    supabase
      .from("rechute_snapshots")
      .select("*")
      .eq("season_id", season.id)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const breakupMs = Date.parse(`${season.breakupDate}T00:00:00Z`);
  const daysSinceBreakup = Math.max(
    0,
    Math.floor((Date.now() - breakupMs) / 86_400_000),
  );
  const total = rechute?.total_score ?? 0;
  return {
    id: season.id,
    title: season.title,
    status: seasonRow?.status ?? "ACTIVE",
    matchup: season.title,
    breakupDate: season.breakupDate,
    daysSinceBreakup,
    roles: season.roles,
    balanceMkb: season.balanceMkb ?? 0,
    isDemo: false,
    rechute: {
      total,
      delta: 0,
      label: rechute ? rechute.reason : "Aucune observation consolidée",
      explanation: rechute
        ? "Dernier snapshot réel enregistré pour la saison."
        : "Le Rechutomètre sera alimenté par les futures actions confirmées.",
      segments: [
        { label: "Proximité", value: rechute?.proximity_score ?? 0, delta: 0 },
        { label: "Physique", value: rechute?.physical_score ?? 0, delta: 0 },
        {
          label: "Régularité",
          value: rechute?.regularity_score ?? 0,
          delta: 0,
        },
        {
          label: "Engagement",
          value: rechute?.commitment_score ?? 0,
          delta: 0,
        },
      ],
    },
  };
}
