export interface BetQuoteLegResult {
  marketId: string;
  outcomeId: string;
  eventCode: string;
  fairProbability: number;
  displayedOdds: number;
  oddsVersion: number;
}

export interface BetQuoteResult {
  quoteId: string;
  betType: "SINGLE" | "ACCUMULATOR";
  stakeMkb: number;
  totalOdds: number;
  potentialReturnMkb: number;
  expiresAt: string;
  correlationAdjustment: number | null;
  legs: BetQuoteLegResult[];
}

export interface PlacedBetResult {
  betId: string;
  ticketNumber: string;
  balanceMkb: number;
  stakeMkb: number;
  totalOdds: number;
  potentialReturnMkb: number;
}

export interface BettingActionFailure {
  ok: false;
  code: import("./betting-errors").BettingErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface BetQuoteActionSuccess {
  ok: true;
  quote: BetQuoteResult;
}

export interface PlaceBetActionSuccess {
  ok: true;
  bet: PlacedBetResult;
}

export type BetQuoteActionResult = BetQuoteActionSuccess | BettingActionFailure;
export type PlaceBetActionResult = PlaceBetActionSuccess | BettingActionFailure;
