import { describe, expect, it } from "vitest";

import { mapLiveRow } from "@/data/supabase/lives/live-mappers";

describe("mapLiveRow", () => {
  it("maps persisted live data without inventing an action or market", () => {
    const live = mapLiveRow(
      {
        id: "10000000-0000-4000-8000-000000000001",
        title: "Soirée planifiée",
        live_type: "PROGRAMMED",
        status: "SCHEDULED",
        scheduled_start: "2026-07-20T18:00:00.000Z",
        scheduled_end: "2026-07-20T22:00:00.000Z",
        host_user_id: "20000000-0000-4000-8000-000000000001",
      },
      {
        hostName: "Chloé",
        participantNames: ["Chloé", "Bob"],
        marketCount: 0,
      },
    );

    expect(live).toMatchObject({
      id: "10000000-0000-4000-8000-000000000001",
      type: "Programmé",
      status: "SCHEDULED",
      host: "Chloé",
      marketCount: 0,
      participants: ["Chloé", "Bob"],
    });
    expect(live.lastEvent).toBe("Aucune action déclarée pour ce live.");
  });
});
