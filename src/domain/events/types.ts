export const EVENT_REPORT_TYPES = [
  "FRIENDLY_MEETING",
  "AFFECTIONATE_GESTURE",
  "KISS",
  "DIPLOMATIC_INCIDENT",
  "OFFICIAL_RELATIONSHIP",
] as const;

export type EventReportType = (typeof EVENT_REPORT_TYPES)[number];

export const EVENT_REPORT_LABELS: Record<EventReportType, string> = {
  FRIENDLY_MEETING: "Réunion amicale",
  AFFECTIONATE_GESTURE: "Geste affectueux",
  KISS: "Bisou sur la bouche",
  DIPLOMATIC_INCIDENT: "Incident diplomatique",
  OFFICIAL_RELATIONSHIP: "Couple officiel",
};

export const EVENT_REPORT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
] as const;

export type EventReportStatus = (typeof EVENT_REPORT_STATUSES)[number];

export const EVENT_VOTE_DECISIONS = ["CONFIRM", "REJECT"] as const;

export type EventVoteDecision = (typeof EVENT_VOTE_DECISIONS)[number];

export interface EventReportAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface EventReportEvidence {
  id: string;
  caption: string | null;
  mediaType: string;
}

export interface EventReportMarketLink {
  id: string;
  title: string;
  outcomeLabel: string;
}

export interface EventReportVoteView {
  displayName: string;
  decision: EventVoteDecision;
}

export interface EventReportView {
  id: string;
  author: EventReportAuthor;
  reportType: EventReportType;
  occurredAt: string;
  declaredAt: string;
  note: string;
  status: EventReportStatus;
  evidence: EventReportEvidence[];
  market: EventReportMarketLink | null;
  votes: {
    confirmCount: number;
    rejectCount: number;
    currentUserDecision: EventVoteDecision | null;
    voters: EventReportVoteView[];
  };
}

export interface ReportableMarket {
  id: string;
  title: string;
  outcomes: Array<{ id: string; label: string }>;
}
