import { OddsDomainError, type MarketPricingResult } from "@/domain/odds";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export interface OutcomeIdentifiers {
  readonly outcomeId: string;
  readonly snapshotId: string;
}

export interface SnapshotIdentifiers {
  readonly marketId: string;
  readonly outcomes: Readonly<Record<string, OutcomeIdentifiers>>;
}

export interface OutcomeUpdateDraft extends TablesUpdate<"market_outcomes"> {
  readonly id: string;
  readonly market_id: string;
  readonly fair_probability: number;
  readonly displayed_odds: number;
}

export interface OddsSnapshotInsertDraft extends TablesInsert<"odds_snapshots"> {
  readonly id: string;
  readonly market_id: string;
  readonly outcome_id: string;
  readonly odds_version: number;
  readonly calculated_at: string;
}

export interface OddsSnapshotDraft {
  readonly outcomeUpdates: readonly OutcomeUpdateDraft[];
  readonly snapshots: readonly OddsSnapshotInsertDraft[];
}

export function buildOddsSnapshotDraft(
  pricing: MarketPricingResult,
  identifiers: SnapshotIdentifiers,
): OddsSnapshotDraft {
  const outcomeUpdates: OutcomeUpdateDraft[] = [];
  const snapshots: OddsSnapshotInsertDraft[] = [];

  for (const outcome of pricing.pricedOutcomes) {
    const ids = identifiers.outcomes[outcome.code];
    if (!ids?.outcomeId || !ids.snapshotId) {
      throw new OddsDomainError(
        "MISSING_OUTCOME_IDENTIFIER",
        `Les identifiants de l'issue ${outcome.code} sont absents.`,
        { outcomeCode: outcome.code },
      );
    }
    outcomeUpdates.push({
      id: ids.outcomeId,
      market_id: identifiers.marketId,
      fair_probability: outcome.fairProbability,
      displayed_odds: outcome.displayedOdds,
    });
    snapshots.push({
      id: ids.snapshotId,
      market_id: identifiers.marketId,
      outcome_id: ids.outcomeId,
      odds_version: pricing.oddsVersion,
      calculated_at: pricing.calculatedAt,
      fair_probability: outcome.fairProbability,
      displayed_odds: outcome.displayedOdds,
      input_snapshot: pricing.inputSnapshot,
      reason: pricing.reason,
    });
  }

  return { outcomeUpdates, snapshots };
}
