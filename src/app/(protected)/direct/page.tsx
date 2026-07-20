import Link from "next/link";

import { requireAuth } from "@/auth/require-auth";
import { EventReportCard } from "@/components/events/event-report-card";
import { EmptyState } from "@/components/states/empty-state";
import { PageIntro } from "@/components/ui/page-intro";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageIntro
        action={
          <Link className="mk-primary-action" href="/report">
            + Déclarer
          </Link>
        }
        description="Une preuve, deux votes, une décision. Tout se joue entre nous."
        eyebrow="Salle privée · 7 membres"
        title={
          <>
            Le groupe fait{" "}
            <span className="text-[var(--brand)]">le marché.</span>
          </>
        }
      />

      <SegmentedFilter
        ariaLabel="Filtrer les événements"
        items={Object.entries(filters).map(([key, filter]) => ({
          active: key === activeView,
          href: key === "pending" ? "/direct" : `/direct?vue=${key}`,
          label: `${filter.label}${key === activeView ? ` · ${reports.length}` : ""}`,
        }))}
      />

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
