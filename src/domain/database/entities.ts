import type { Json } from "@/types/database";

import type {
  ActionCertainty,
  ActionStatus,
  BetLegStatus,
  BetStatus,
  BetType,
  LiveStatus,
  LiveType,
  MarketCategory,
  MarketStatus,
  MarketType,
  OutcomeResultStatus,
  SeasonMemberRole,
  SeasonStatus,
  SubjectKey,
} from "./enums";

export interface Season {
  id: string;
  title: string;
  description: string | null;
  breakupDate: string;
  startedAt: string;
  endedAt: string | null;
  status: SeasonStatus;
  startingBalanceMkb: number;
  secretBetsUntilClose: boolean;
}

export interface SeasonMember {
  seasonId: string;
  userId: string;
  role: SeasonMemberRole;
  subjectKey: SubjectKey | null;
  isActive: boolean;
  joinedAt: string;
}

export interface LiveSession {
  id: string;
  seasonId: string;
  title: string;
  liveType: LiveType;
  status: LiveStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  physicalMultiplier: number;
  sentimentalMultiplier: number;
}

export interface Action {
  id: string;
  seasonId: string;
  liveId: string | null;
  actionTypeId: string;
  occurredAt: string;
  declaredAt: string;
  officialOccurredAt: string | null;
  declaredBy: string;
  status: ActionStatus;
  certainty: ActionCertainty;
  classified: boolean;
}

export interface Market {
  id: string;
  seasonId: string;
  liveId: string | null;
  templateId: string | null;
  title: string;
  eventCode: string;
  marketType: MarketType;
  category: MarketCategory;
  status: MarketStatus;
  opensAt: string;
  closesAt: string;
  currentQ: number | null;
  currentHalfLifeDays: number | null;
  margin: number;
  oddsVersion: number;
  settlementRule: Json;
}

export interface MarketOutcome {
  id: string;
  marketId: string;
  code: string;
  label: string;
  fairProbability: number;
  displayedOdds: number;
  resultStatus: OutcomeResultStatus;
  sortOrder: number;
}

export interface Bet {
  id: string;
  seasonId: string;
  userId: string;
  betType: BetType;
  stakeMkb: number;
  totalOdds: number;
  potentialReturnMkb: number;
  status: BetStatus;
  placedAt: string;
  settledAt: string | null;
}

export interface BetLeg {
  id: string;
  betId: string;
  marketId: string;
  outcomeId: string;
  oddsAtBet: number;
  fairProbabilityAtBet: number;
  oddsVersionAtBet: number;
  status: BetLegStatus;
  settledAt: string | null;
}

export interface Wallet {
  seasonId: string;
  userId: string;
  balanceMkb: number;
  totalStakedMkb: number;
  totalReturnedMkb: number;
  version: number;
  updatedAt: string;
}

export interface RechuteSnapshot {
  id: string;
  seasonId: string;
  proximityScore: number;
  physicalScore: number;
  regularityScore: number;
  commitmentScore: number;
  totalScore: number;
  reason: string;
  actionId: string | null;
  calculatedAt: string;
}
