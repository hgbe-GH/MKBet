import Image from "next/image";

import { EventVoteControls } from "@/components/events/event-vote-controls";
import { GlassSurface } from "@/components/ui/glass-surface";
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
    <GlassSurface
      as="article"
      className="overflow-hidden rounded-2xl"
      data-report-status={report.status}
      variant="opaque"
    >
      <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <div>
          <p className="text-xs font-bold tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Signalé par {report.author.displayName}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
            {EVENT_REPORT_LABELS[report.reportType]}
          </h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-black text-[var(--text-secondary)]">
          {statusLabels[report.status]}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-6">
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
        <div className="grid gap-1 bg-black/20 p-1 sm:grid-cols-2">
          {report.evidence.map((evidence) => (
            <Image
              alt={evidence.caption ?? "Preuve privée du signalement"}
              className="aspect-[4/3] h-full w-full rounded-xl bg-[var(--surface-muted)] object-cover"
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

      <div className="px-4 py-5 sm:px-6">
        {report.market ? (
          <div className="mb-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2 text-sm text-[#ffe0aa]">
            <span className="font-bold">Marché suspendu :</span>{" "}
            {report.market.title}, issue {report.market.outcomeLabel}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3" aria-label="État des votes">
          <p className="text-sm font-bold tabular-nums">
            {report.votes.confirmCount} validation
            {report.votes.confirmCount > 1 ? "s" : ""} sur 2
          </p>
          <p className="text-right text-sm font-bold tabular-nums">
            {report.votes.rejectCount} invalidation
            {report.votes.rejectCount > 1 ? "s" : ""} sur 2
          </p>
        </div>
        {canVote ? <EventVoteControls reportId={report.id} /> : null}
        {isAuthor && report.status === "PENDING" ? (
          <p className="mt-4 rounded-lg bg-white/[0.06] px-3 py-2 text-sm font-semibold">
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
    </GlassSurface>
  );
}
