import { notFound } from "next/navigation";

import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { MarketForm } from "@/components/admin/market-form";
import {
  getDefaultMarketSchedule,
  listActiveBinaryTemplates,
} from "@/data/supabase/markets/template-repository";

export const dynamic = "force-dynamic";

export default async function NewMarketPage() {
  const season = await requireSportsbookSeason();
  if (!season.roles.includes("ADMIN")) notFound();
  const [templates, schedule] = await Promise.all([
    listActiveBinaryTemplates(),
    getDefaultMarketSchedule(season.id),
  ]);
  const opensAt = new Date(
    Date.parse(schedule.physical_deadline_at) - 30 * 86_400_000,
  ).toISOString();
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Créer un marché binaire
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Les cotes sont calculées atomiquement par PostgreSQL depuis le
          template sélectionné.
        </p>
      </header>
      <MarketForm
        defaultDates={{
          opensAt,
          closesAt: schedule.closes_at,
          deadlineAt: schedule.physical_deadline_at,
        }}
        seasonId={season.id}
        templates={templates.map((template) => ({
          code: template.code,
          title: template.title_template,
        }))}
      />
    </div>
  );
}
