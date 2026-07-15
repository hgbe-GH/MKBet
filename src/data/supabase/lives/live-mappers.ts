import type { LiveStatus, LiveType } from "@/domain/database/enums";
import type { SportsbookLive } from "@/fixtures/sportsbook/types";

export interface PersistedLivePresentationRow {
  id: string;
  title: string;
  live_type: LiveType;
  status: LiveStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  host_user_id: string | null;
}

function liveTypeLabel(liveType: LiveType): string {
  switch (liveType) {
    case "PROGRAMMED":
      return "Programmé";
    case "TIME_WINDOW":
      return "Fenêtre";
    case "INSTANT":
      return "Instantané";
  }
}

export function mapLiveRow(
  row: PersistedLivePresentationRow,
  related: {
    hostName: string | null;
    participantNames: string[];
    marketCount: number;
  },
): SportsbookLive {
  return {
    id: row.id,
    title: row.title,
    type: liveTypeLabel(row.live_type),
    status: row.status,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    host: related.hostName ?? "Hôte non assigné",
    marketCount: related.marketCount,
    participants: related.participantNames,
    lastEvent: "Aucune action déclarée pour ce live.",
  };
}
