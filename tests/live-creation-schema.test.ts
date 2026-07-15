import { describe, expect, it } from "vitest";

import { createLiveSessionSchema } from "@/application/lives/create-live-schema";

const baseInput = {
  seasonId: "10000000-0000-4000-8000-000000000001",
  title: "Soirée de lancement",
  description: null,
  locationLabel: null,
  hostUserId: "20000000-0000-4000-8000-000000000001",
  attendees: [
    {
      userId: "30000000-0000-4000-8000-000000000001",
      liveRole: "REPORTER",
    },
  ],
  idempotencyKey: "40000000-0000-4000-8000-000000000001",
};

describe("createLiveSessionSchema", () => {
  it("requires an ordered schedule for programmed lives", () => {
    const valid = createLiveSessionSchema.safeParse({
      ...baseInput,
      liveType: "PROGRAMMED",
      scheduledStart: "2026-07-20T18:00:00.000Z",
      scheduledEnd: "2026-07-20T22:00:00.000Z",
    });
    const missingEnd = createLiveSessionSchema.safeParse({
      ...baseInput,
      liveType: "PROGRAMMED",
      scheduledStart: "2026-07-20T18:00:00.000Z",
      scheduledEnd: null,
    });
    const inverted = createLiveSessionSchema.safeParse({
      ...baseInput,
      liveType: "TIME_WINDOW",
      scheduledStart: "2026-07-20T22:00:00.000Z",
      scheduledEnd: "2026-07-20T18:00:00.000Z",
    });

    expect(valid.success).toBe(true);
    expect(missingEnd.success).toBe(false);
    expect(inverted.success).toBe(false);
  });

  it("accepts an instant live with no schedule or a complete informative schedule", () => {
    expect(
      createLiveSessionSchema.safeParse({
        ...baseInput,
        liveType: "INSTANT",
        scheduledStart: null,
        scheduledEnd: null,
      }).success,
    ).toBe(true);
    expect(
      createLiveSessionSchema.safeParse({
        ...baseInput,
        liveType: "INSTANT",
        scheduledStart: "2026-07-20T18:00:00.000Z",
        scheduledEnd: "2026-07-20T22:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      createLiveSessionSchema.safeParse({
        ...baseInput,
        liveType: "INSTANT",
        scheduledStart: "2026-07-20T18:00:00.000Z",
        scheduledEnd: null,
      }).success,
    ).toBe(false);
  });

  it("allows only non-host reporter or viewer attendees", () => {
    expect(
      createLiveSessionSchema.safeParse({
        ...baseInput,
        liveType: "INSTANT",
        scheduledStart: null,
        scheduledEnd: null,
        attendees: [
          {
            userId: baseInput.hostUserId,
            liveRole: "REPORTER",
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      createLiveSessionSchema.safeParse({
        ...baseInput,
        liveType: "INSTANT",
        scheduledStart: null,
        scheduledEnd: null,
        attendees: [
          {
            userId: "30000000-0000-4000-8000-000000000001",
            liveRole: "HOST",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
