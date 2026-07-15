import Link from "next/link";

import { requireAuth } from "@/auth/require-auth";
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
      <header className="mt-3 border-b border-[var(--border)] pb-5">
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Déclarer un événement
        </h1>
        <p className="mt-3 max-w-xl leading-7 text-[var(--text-secondary)]">
          Décris uniquement ce que tu as observé. Les preuves restent privées et
          le groupe tranche avec deux votes concordants.
        </p>
      </header>
      <section
        aria-label="Formulaire de signalement"
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_16px_40px_rgba(76,5,15,0.06)] sm:p-7"
      >
        <EventReportForm markets={markets} />
      </section>
    </div>
  );
}

