import Link from "next/link";

import { requireAuth } from "@/auth/require-auth";
import { EventReportCard } from "@/components/events/event-report-card";
import { EmptyState } from "@/components/states/empty-state";
import { listEventReports } from "@/data/supabase/events/repository";
import type { EventReportStatus } from "@/domain/events/types";

export const dynamic = "force-dynamic";

const filters = {
  pending: { label: "À vérifier", status: "PENDING" },
  confirmed: { label: "Confirmés", status: "CONFIRMED" },
  rejected: { label: "Invalidés", status: "REJECTED" },
} as const satisfies Record<
  string,
  { label: string; status: EventReportStatus }
>;

interface DirectPageProps {
  searchParams?: Promise<{ vue?: string }>;
}

export default async function DirectPage({ searchParams }: DirectPageProps) {
  const claims = await requireAuth("/direct");
  const requestedView = (await searchParams)?.vue;
  const activeView =
    requestedView && requestedView in filters ? requestedView : "pending";
  const activeFilter = filters[activeView as keyof typeof filters];
  const reports = await listEventReports(claims.userId, activeFilter.status);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="rounded-xl bg-[var(--brand-strong)] px-5 py-6 text-white sm:px-7 sm:py-8">
        <p className="text-sm font-black text-red-100">Salle privée</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          Margot × Kévin - Direct
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-red-50 sm:text-base">
          Les faits sont proposés par le groupe. Deux validations confirment,
          deux invalidations rejettent.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-white px-4 py-2 text-sm font-black text-[var(--brand-strong)] transition-transform active:scale-[0.98]"
          href="/report"
        >
          Déclarer un événement
        </Link>
      </header>

      <nav
        aria-label="Filtrer les événements"
        className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"
      >
        {Object.entries(filters).map(([key, filter]) => {
          const active = key === activeView;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex min-h-11 items-center justify-center rounded-md bg-[var(--brand)] px-2 text-center text-sm font-black text-white"
                  : "flex min-h-11 items-center justify-center rounded-md px-2 text-center text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              }
              href={key === "pending" ? "/direct" : `/direct?vue=${key}`}
              key={key}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {reports.length === 0 ? (
        <EmptyState
          title={`Aucun événement ${activeFilter.label.toLocaleLowerCase("fr-FR")}`}
          description="Le fil se remplira dès qu’un membre partagera un fait avec le groupe."
        />
      ) : (
        <div className="grid gap-5">
          {reports.map((report) => (
            <EventReportCard
              currentUserId={claims.userId}
              key={report.id}
              report={report}
            />
          ))}
        </div>
      )}
    </div>
  );
}

