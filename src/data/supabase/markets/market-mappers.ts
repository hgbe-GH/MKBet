import type { Tables } from "@/types/database";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";

type MarketRow = Tables<"markets">;
type OutcomeRow = Tables<"market_outcomes">;
type SnapshotRow = Tables<"odds_snapshots">;

function settlementRuleLabel(value: MarketRow["settlement_rule"]): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const trigger = value.trigger_action_code;
    if (typeof trigger === "string") {
      return `Action ${trigger} confirmée, heure officielle prioritaire.`;
    }
  }
  return "Règle de règlement conservée dans le template du marché.";
}

export function mapMarketRow(
  market: MarketRow,
  outcomes: readonly OutcomeRow[],
  snapshots: readonly SnapshotRow[],
): SportsbookMarket {
  const marketSnapshots = snapshots
    .filter((snapshot) => snapshot.market_id === market.id)
    .toSorted((left, right) =>
      left.calculated_at.localeCompare(right.calculated_at),
    );
  const history = marketSnapshots
    .filter((snapshot) => {
      const outcome = outcomes.find((item) => item.id === snapshot.outcome_id);
      return outcome?.code === "YES" || outcomes.length > 2;
    })
    .map((snapshot) => ({
      label: new Date(snapshot.calculated_at).toLocaleString("fr-FR"),
      odds: snapshot.displayed_odds,
    }));

  return {
    id: market.id,
    title: market.title,
    trashTitle: market.trash_title,
    description: market.description ?? "Marché officiel MK Bet.",
    category: market.category,
    type: market.market_type,
    status: market.status,
    deadline: market.deadline_at ?? market.closes_at,
    betCount: 0,
    variationLabel: `Version ${market.odds_version}`,
    oddsVersion: market.odds_version,
    isLive: market.live_id !== null,
    suspensionReason: market.suspension_reason ?? undefined,
    settlementRule: settlementRuleLabel(market.settlement_rule),
    outcomes: outcomes
      .filter((outcome) => outcome.market_id === market.id)
      .toSorted((left, right) => left.sort_order - right.sort_order)
      .map((outcome) => {
        const outcomeSnapshots = marketSnapshots.filter(
          (snapshot) => snapshot.outcome_id === outcome.id,
        );
        const previous = outcomeSnapshots.at(-2)?.displayed_odds ?? null;
        const movement =
          previous === null || previous === outcome.displayed_odds
            ? "STABLE"
            : outcome.displayed_odds > previous
              ? "UP"
              : "DOWN";
        return {
          id: outcome.id,
          marketId: market.id,
          code: outcome.code,
          label: outcome.label,
          odds: outcome.displayed_odds,
          fairProbability: outcome.fair_probability,
          movement,
          previousOdds: previous,
          status: market.status,
          result: outcome.result_status,
        };
      }),
    history:
      history.length > 0
        ? history
        : [
            {
              label: "Cote actuelle",
              odds: outcomes[0]?.displayed_odds ?? 1.05,
            },
          ],
  };
}
