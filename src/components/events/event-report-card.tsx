import { Badge, type BadgeVariant } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import {
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core/MetadataList";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
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

const statusVariants: Record<EventReportView["status"], BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "error",
};

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

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
    <article data-report-status={report.status}>
      <Card className="overflow-hidden" padding={0}>
        <div className="p-4 sm:p-6">
          <VStack gap={4}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Text color="secondary" display="block" type="supporting">
                  Signalé par {report.author.displayName}
                </Text>
                <Heading className="mt-1" level={2}>
                  {EVENT_REPORT_LABELS[report.reportType]}
                </Heading>
              </div>
              <Badge
                label={statusLabels[report.status]}
                variant={statusVariants[report.status]}
              />
            </div>

            <Text as="p">{report.note}</Text>
            <MetadataList columns={2}>
              <MetadataListItem label="Événement du">
                <time dateTime={report.occurredAt}>
                  {formatReportDate(report.occurredAt)}
                </time>
              </MetadataListItem>
              <MetadataListItem label="Déclaré le">
                <time dateTime={report.declaredAt}>
                  {formatReportDate(report.declaredAt)}
                </time>
              </MetadataListItem>
            </MetadataList>
          </VStack>
        </div>

        {report.evidence.length > 0 ? (
          <div className="grid gap-1 bg-black/20 p-1 sm:grid-cols-2">
            {report.evidence.map((evidence) => (
              <Image
                alt={evidence.caption ?? "Preuve privée du signalement"}
                className="aspect-[4/3] h-full w-full rounded-lg bg-[var(--color-background-muted)] object-cover"
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

        <div className="p-4 sm:p-6">
          <VStack gap={4}>
            {report.market ? (
              <Card padding={3} variant="yellow">
                <Text type="supporting">
                  <strong>Marché suspendu :</strong> {report.market.title},
                  issue {report.market.outcomeLabel}
                </Text>
              </Card>
            ) : null}
            <div
              aria-label="État des votes"
              className="grid gap-3 sm:grid-cols-2"
            >
              <ProgressBar
                hasValueLabel
                label="Validations"
                max={2}
                value={report.votes.confirmCount}
                variant="success"
              />
              <ProgressBar
                hasValueLabel
                label="Invalidations"
                max={2}
                value={report.votes.rejectCount}
                variant="error"
              />
            </div>
            <div className="grid grid-cols-2 gap-3" aria-hidden="true">
              <Text type="supporting">
                {report.votes.confirmCount} validation
                {report.votes.confirmCount > 1 ? "s" : ""} sur 2
              </Text>
              <Text className="text-right" type="supporting">
                {report.votes.rejectCount} invalidation
                {report.votes.rejectCount > 1 ? "s" : ""} sur 2
              </Text>
            </div>
            {canVote ? <EventVoteControls reportId={report.id} /> : null}
            {isAuthor && report.status === "PENDING" ? (
              <Card padding={3} variant="muted">
                <Text type="supporting">
                  Tu ne peux pas voter sur ton propre signalement.
                </Text>
              </Card>
            ) : null}
            {report.votes.currentUserDecision ? (
              <Text color="secondary" type="supporting">
                Ton vote :{" "}
                {report.votes.currentUserDecision === "CONFIRM"
                  ? "validation"
                  : "invalidation"}
                .
              </Text>
            ) : null}
          </VStack>
        </div>
      </Card>
    </article>
  );
}
