import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { requireSingleRoom } from "@/application/sportsbook/require-single-room";
import { requireAuth } from "@/auth/require-auth";
import { AsyncState } from "@/components/astryx/async-state";
import { PageHeading } from "@/components/astryx/page-heading";
import { EventReportCard } from "@/components/events/event-report-card";
import { ActivityFeed } from "@/components/sportsbook/activity-feed";
import { MarketGroup } from "@/components/sportsbook/market-group";
import { TodaySummary } from "@/components/sportsbook/today-summary";
import { listEventReports } from "@/data/supabase/events/repository";
import { listSeasonLeaderboard } from "@/data/supabase/leaderboard/leaderboard-repository";
import { listRecentMarketAudit } from "@/data/supabase/markets/audit-repository";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";
import type { TimelineEvent } from "@/fixtures/sportsbook/types";

export const dynamic = "force-dynamic";

interface DirectPageProps {
  searchParams?: Promise<{ vue?: string }>;
}

const auditActionLabels: Record<string, string> = {
  MARKET_OPENED: "Un marché a été ouvert",
  MARKET_STATUS_CHANGED: "Le statut d’un marché a changé",
  SETTLE_MARKET_FROM_EVENT: "Un marché a été réglé après validation",
};

export default async function DirectPage({ searchParams }: DirectPageProps) {
  void searchParams;
  const [claims, season] = await Promise.all([
    requireAuth("/direct"),
    requireSingleRoom(),
  ]);
  const [markets, reports, leaderboard, auditRows] = await Promise.all([
    listSeasonMarkets(
      season.id,
      { category: "ALL", status: "OPEN", sort: "deadline", q: "" },
      2,
    ),
    listEventReports(claims.userId, "PENDING"),
    listSeasonLeaderboard(season.id),
    listRecentMarketAudit(season.id, 5),
  ]);
  const rank =
    leaderboard.find((row) => row.userId === claims.userId)?.rank ?? null;
  const featuredMarkets = markets.slice(0, 2);
  const activity: TimelineEvent[] = auditRows.map((row) => ({
    id: String(row.id),
    occurredAt: row.created_at,
    category: "SYSTEM",
    title: auditActionLabels[row.action] ?? "Le marché a été mis à jour",
    description: "Modification enregistrée dans le journal privé de la salle.",
    status: "Marché",
    classified: false,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PageHeading
        description="Ton solde, les décisions du groupe et les deux marchés à suivre maintenant."
        eyebrow={season.title}
        title="Aujourd’hui"
      />

      <TodaySummary
        activeMarketCount={featuredMarkets.length}
        balanceMkb={season.balanceMkb}
        pendingCount={reports.length}
        rank={rank}
      />

      <section aria-labelledby="priority-actions-title">
        <Card padding={5}>
          <VStack gap={4}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge
                  label={
                    reports.length > 0
                      ? `${reports.length} à vérifier`
                      : "Rien d’urgent"
                  }
                  variant={reports.length > 0 ? "warning" : "success"}
                />
                <Heading className="mt-2" id="priority-actions-title" level={2}>
                  Actions prioritaires
                </Heading>
              </div>
              <Button
                href="/report"
                label="Déclarer un fait"
                size="lg"
                variant="primary"
              />
            </div>
            <Text color="secondary">
              {reports.length > 0
                ? "Le groupe attend une décision. Chaque vote est définitif."
                : "Tu peux déclarer un fait observé avec son heure réelle et des preuves privées."}
            </Text>
          </VStack>
        </Card>
      </section>

      <section aria-labelledby="today-markets-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading id="today-markets-title" level={2}>
            Marchés à suivre
          </Heading>
          <Button
            href="/markets"
            label="Tous les marchés"
            variant="secondary"
          />
        </div>
        <MarketGroup
          emptyDescription="Aucun marché n’est ouvert pour le moment."
          markets={featuredMarkets}
          title="Cotes du jour"
        />
      </section>

      <section aria-labelledby="pending-reports-title" className="space-y-4">
        <Heading id="pending-reports-title" level={2}>
          Validations en attente
        </Heading>
        {reports.length === 0 ? (
          <AsyncState
            action={
              <Button
                href="/report"
                label="Déclarer un fait"
                variant="secondary"
              />
            }
            description="Le groupe a traité tous les signalements visibles."
            kind="empty"
            title="Aucune validation en attente"
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
      </section>

      <ActivityFeed events={activity} />
    </div>
  );
}
