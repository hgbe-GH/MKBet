import Image from "next/image";

import { EventVoteControls } from "@/components/events/event-vote-controls";
import {
  EVENT_REPORT_LABELS,
  type EventReportView,
} from "@/domain/events/types";

const statusLabels = {
  PENDING: "À vérifier",
  CONFIRMED: "Confirmé",
  REJECTED: "Invalidé",
} as const;

export function EventReportCard({
  currentUserId,
  report,
}: {
  currentUserId: string;
  report: EventReportView;
}) {
  const isAuthor = currentUserId === report.author.id;
  const canVote =
    report.status === "PENDING" &&
    !isAuthor &&
    !report.votes.currentUserDecision;

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(76,5,15,0.07)]">
      <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5">
        <div>
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            Signalé par {report.author.displayName}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">
            {EVENT_REPORT_LABELS[report.reportType]}
          </h2>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--text-secondary)]">
          {statusLabels[report.status]}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="leading-relaxed text-[var(--text-primary)]">
          {report.note}
        </p>
        <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">
          Événement du{" "}
          <time dateTime={report.occurredAt}>
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Europe/Paris",
            }).format(new Date(report.occurredAt))}
          </time>
        </p>
      </div>

      {report.evidence.length > 0 ? (
        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
          {report.evidence.map((evidence) => (
            <Image
              alt={evidence.caption ?? "Preuve privée du signalement"}
              className="aspect-[4/3] h-full w-full bg-[var(--surface-muted)] object-cover"
              height={720}
              key={evidence.id}
              sizes="(max-width: 640px) 100vw, 360px"
              src={`/api/media/${evidence.id}`}
              unoptimized
              width={960}
            />
          ))}
        </div>
      ) : null}

      <div className="px-4 py-4 sm:px-5">
        {report.market ? (
          <div className="mb-4 rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm">
            <span className="font-bold">Marché suspendu :</span>{" "}
            {report.market.title}, issue {report.market.outcomeLabel}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3" aria-label="État des votes">
          <p className="text-sm font-bold">
            {report.votes.confirmCount} validation
            {report.votes.confirmCount > 1 ? "s" : ""} sur 2
          </p>
          <p className="text-right text-sm font-bold">
            {report.votes.rejectCount} invalidation
            {report.votes.rejectCount > 1 ? "s" : ""} sur 2
          </p>
        </div>
        {canVote ? <EventVoteControls reportId={report.id} /> : null}
        {isAuthor && report.status === "PENDING" ? (
          <p className="mt-4 rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold">
            Tu ne peux pas voter sur ton propre signalement.
          </p>
        ) : null}
        {report.votes.currentUserDecision ? (
          <p className="mt-4 text-sm font-semibold text-[var(--text-secondary)]">
            Ton vote :{" "}
            {report.votes.currentUserDecision === "CONFIRM"
              ? "validation"
              : "invalidation"}
            .
          </p>
        ) : null}
      </div>
    </article>
  );
}
