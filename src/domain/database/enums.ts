import type { Database } from "@/types/database";

export const DATABASE_ENUM_VALUES = {
  season_status: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
  season_member_role: ["ADMIN", "LIVE_HOST", "REPORTER", "PLAYER", "SUBJECT"],
  subject_key: ["MARGOT", "KEVIN"],
  invitation_status: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
  live_status: [
    "PROPOSED",
    "SCHEDULED",
    "BETTING_OPEN",
    "ARMED",
    "LIVE",
    "SUSPENDED",
    "ENDED",
    "VERIFYING",
    "SETTLED",
    "ARCHIVED",
    "CANCELLED",
  ],
  live_type: ["PROGRAMMED", "INSTANT", "TIME_WINDOW"],
  attendance_status: ["EXPECTED", "PRESENT", "ABSENT", "LEFT", "UNKNOWN"],
  live_member_role: ["HOST", "REPORTER", "VIEWER"],
  action_status: [
    "DECLARED",
    "PENDING_CONFIRMATION",
    "CORROBORATED",
    "CONFIRMED",
    "CONTESTED",
    "REJECTED",
    "CLASSIFIED",
    "CORRECTED",
  ],
  action_certainty: [
    "RUMOR",
    "PROBABLE",
    "DIRECT_WITNESS",
    "DIRECT_INFORMATION",
    "CONFIRMED_BY_MARGOT",
    "CONFIRMED_BY_KEVIN",
    "CONFIRMED_BY_BOTH",
  ],
  confirmation_policy: [
    "ONE_REPORTER",
    "TWO_REPORTERS",
    "HOST_CONFIRMATION",
    "ONE_SUBJECT",
    "BOTH_SUBJECTS",
    "ADMIN_DECISION",
  ],
  privacy_level: [
    "PUBLIC",
    "MEMBERS_ONLY",
    "SUBJECTS_AND_ADMINS",
    "CLASSIFIED",
  ],
  confirmation_decision: [
    "CONFIRM",
    "REJECT",
    "CORRECT_TIME",
    "CLASSIFY",
    "NO_COMMENT",
  ],
  media_status: ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"],
  market_type: [
    "BINARY",
    "MULTI_OUTCOME",
    "DATE_RANGE",
    "EXACT_DATE",
    "NEXT_ACTION",
    "OVER_UNDER",
    "ACCUMULATOR",
  ],
  market_category: [
    "CONTACT",
    "PHYSICAL",
    "SEXUAL",
    "RELATIONSHIP",
    "STATUS",
    "CONFLICT",
    "LONG_TERM",
    "LIVE_SPECIAL",
  ],
  market_status: [
    "DRAFT",
    "OPEN",
    "SUSPENDED",
    "CLOSED",
    "PENDING_RESULT",
    "RESULT_DETERMINED",
    "SETTLED",
    "VOID",
    "REFUNDED",
  ],
  outcome_result_status: ["PENDING", "WINNER", "LOSER", "VOID"],
  bet_type: ["SINGLE", "ACCUMULATOR"],
  bet_quote_status: ["OPEN", "CONSUMED", "EXPIRED", "VOID"],
  bet_status: [
    "PENDING",
    "OPEN",
    "WON",
    "LOST",
    "VOID",
    "REFUNDED",
    "PARTIALLY_SETTLED",
  ],
  bet_leg_status: ["OPEN", "WON", "LOST", "VOID"],
  settlement_type: [
    "STANDARD",
    "MANUAL",
    "VOID",
    "REFUND",
    "PARTIAL",
    "CORRECTION",
  ],
  wallet_transaction_type: [
    "INITIAL_CREDIT",
    "BET_STAKE",
    "BET_WIN",
    "BET_REFUND",
    "ADMIN_CREDIT",
    "ADMIN_DEBIT",
    "SURVIVAL_BONUS",
    "CORRECTION",
  ],
  market_effect_type: [
    "Q_SHIFT",
    "SPEED_MULTIPLIER",
    "SUSPEND",
    "CLOSE",
    "SETTLE",
    "OPEN_RELATED",
    "REPRICE",
  ],
} as const satisfies {
  [
    Name in keyof Database["public"]["Enums"]
  ]: readonly Database["public"]["Enums"][Name][];
};

export type SeasonStatus = Database["public"]["Enums"]["season_status"];
export type SeasonMemberRole =
  Database["public"]["Enums"]["season_member_role"];
export type SubjectKey = Database["public"]["Enums"]["subject_key"];
export type LiveStatus = Database["public"]["Enums"]["live_status"];
export type LiveType = Database["public"]["Enums"]["live_type"];
export type ActionStatus = Database["public"]["Enums"]["action_status"];
export type ActionCertainty = Database["public"]["Enums"]["action_certainty"];
export type MarketType = Database["public"]["Enums"]["market_type"];
export type MarketCategory = Database["public"]["Enums"]["market_category"];
export type MarketStatus = Database["public"]["Enums"]["market_status"];
export type OutcomeResultStatus =
  Database["public"]["Enums"]["outcome_result_status"];
export type BetType = Database["public"]["Enums"]["bet_type"];
export type BetQuoteStatus = Database["public"]["Enums"]["bet_quote_status"];
export type BetStatus = Database["public"]["Enums"]["bet_status"];
export type BetLegStatus = Database["public"]["Enums"]["bet_leg_status"];
