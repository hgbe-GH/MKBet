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

