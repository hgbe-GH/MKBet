import type {
  MarketCategory,
  MarketStatus,
  MarketType,
  SeasonMemberRole,
} from "@/domain/database/enums";

export type MarketCategoryFilter = MarketCategory | "ALL";
export type MarketStatusFilter = "ALL" | "OPEN" | "SUSPENDED" | "CLOSED";
export type MarketSort = "popular" | "deadline" | "odds" | "movement";

export type OddsMovement = "UP" | "DOWN" | "STABLE";

export interface RechuteSegment {
  label: "Proximité" | "Physique" | "Régularité" | "Engagement";
  value: number;
  delta: number;
}

export interface RechuteSnapshotUi {
  total: number;
  delta: number;
  label: string;
  explanation: string;
  segments: RechuteSegment[];
}

export interface SportsbookSeasonContext {
  id: string;
  title: string;
  status: string;
  matchup: string;
  breakupDate: string;
  daysSinceBreakup: number;
  roles: SeasonMemberRole[];
  balanceMkb: number;
  rechute: RechuteSnapshotUi;
  isDemo: boolean;
}

export interface SportsbookOutcome {
  id: string;
  marketId: string;
  code: string;
  label: string;
  odds: number;
  fairProbability: number;
  movement: OddsMovement;
  previousOdds: number | null;
  status: MarketStatus;
  result: "PENDING" | "WINNER" | "LOSER" | "VOID";
  line?: number;
  handicap?: string;
}

export interface SportsbookMarket {
  id: string;
  title: string;
  trashTitle?: string;
  description: string;
  category: MarketCategory;
  type: MarketType;
  status: MarketStatus;
  deadline: string;
  betCount: number;
  variationLabel: string;
  oddsVersion: number;
  isLive: boolean;
  lastAction?: string;
  suspensionReason?: string;
  settlementRule: string;
  outcomes: SportsbookOutcome[];
  history: Array<{ label: string; odds: number }>;
}

export interface SportsbookLive {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  host: string;
  marketCount: number;
  participants: string[];
  lastEvent: string;
}

export interface SportsbookBetLeg {
  marketTitle: string;
  outcomeLabel: string;
  oddsAtBet: number;
  currentOdds: number;
  status: "OPEN" | "WON" | "LOST" | "VOID";
}

export interface SportsbookBet {
  id: string;
  placedAt: string;
  type: "SINGLE" | "ACCUMULATOR";
  stakeMkb: number;
  totalOdds: number;
  potentialReturnMkb: number;
  status: "OPEN" | "WON" | "LOST" | "VOID" | "REFUNDED";
  legs: SportsbookBetLeg[];
}

export interface SportsbookResult {
  id: string;
  title: string;
  resolvedAt: string;
  status: "SETTLED" | "VOID" | "PENDING_RESULT" | "CONTESTED";
  summary: string;
}

export interface TimelineEvent {
  id: string;
  occurredAt: string;
  category: MarketCategory | "SYSTEM";
  title: string;
  description: string;
  status: string;
  classified: boolean;
}

export interface LeaderboardRow {
  userId: string;
  rank: number;
  playerName: string;
  avatarUrl?: string | null;
  capitalMkb: number;
  netProfitMkb: number;
  totalStakedMkb?: number;
  totalReturnedMkb?: number;
  successRate?: number;
  averageOdds?: number;
  badge?: string;
}

export interface BetSlipSelection {
  marketId: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  odds: number;
  oddsVersion: number;
  status: MarketStatus;
  movement: OddsMovement;
}

export interface SportsbookReadRepository {
  getSeasonContext(seasonId: string | null): Promise<SportsbookSeasonContext>;
}

export interface MarketReadRepository {
  listMarkets(filters: {
    category: MarketCategoryFilter;
    status: MarketStatusFilter;
    sort: MarketSort;
    q: string;
  }): Promise<SportsbookMarket[]>;
  getMarket(marketId: string): Promise<SportsbookMarket | null>;
}

export interface LiveReadRepository {
  listLives(): Promise<SportsbookLive[]>;
  getLive(liveId: string): Promise<SportsbookLive | null>;
}

export interface LeaderboardReadRepository {
  listLeaderboard(): Promise<LeaderboardRow[]>;
}
