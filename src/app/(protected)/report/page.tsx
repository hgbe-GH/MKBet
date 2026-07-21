import Link from "next/link";

import { requireAuth } from "@/auth/require-auth";
import { PageHeading } from "@/components/astryx/page-heading";
import { EventReportForm } from "@/components/events/event-report-form";
import { listReportableMarkets } from "@/data/supabase/events/repository";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  await requireAuth("/report");
  const markets = await listReportableMarkets();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline"
        href="/direct"
      >
        Retour au direct
      </Link>
      <PageHeading
        eyebrow="Nouveau signalement"
        title="Déclarer un événement"
        description="Décris uniquement ce que tu as observé. Les preuves restent privées et le groupe tranche."
      />
      <section
        aria-label="Formulaire de signalement"
        className="mk-surface-opaque mt-6 rounded-2xl p-5 sm:p-7"
      >
        <EventReportForm markets={markets} />
      </section>
    </div>
  );
}
