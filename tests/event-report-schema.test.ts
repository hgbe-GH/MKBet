import { describe, expect, it } from "vitest";

import {
  createEventReportFormSchema,
  EVENT_REPORT_TYPES,
  eventReportFormSchema,
} from "@/application/events/event-report-schema";

const validInput = {
  reportType: "KISS",
  occurredAt: "2026-07-15T14:00:00.000Z",
  note: "Un baiser observé par le groupe.",
  marketId: "6d6b0000-0000-4000-8000-000000000010",
  outcomeId: "6d6b0000-0000-4000-8000-000000000011",
  files: [
    { name: "preuve.jpg", size: 1_024, type: "image/jpeg" },
  ],
};

describe("eventReportFormSchema", () => {
  it("accepts every supported report type", () => {
    expect(EVENT_REPORT_TYPES).toHaveLength(5);

    for (const reportType of EVENT_REPORT_TYPES) {
      expect(
        eventReportFormSchema.safeParse({
          ...validInput,
          reportType,
          marketId: undefined,
          outcomeId: undefined,
        }).success,
      ).toBe(true);
    }
  });

  it("requires a past or present UTC instant and a note of at most 500 characters", () => {
    const now = new Date("2026-07-15T15:00:00.000Z");

    expect(eventReportFormSchema.safeParse(validInput).success).toBe(true);
    expect(
      eventReportFormSchema.safeParse({ ...validInput, note: "x".repeat(500) })
        .success,
    ).toBe(true);
    expect(
      eventReportFormSchema.safeParse({ ...validInput, note: "x".repeat(501) })
        .success,
    ).toBe(false);
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        occurredAt: "2026-07-15 14:00",
      }).success,
    ).toBe(false);
    expect(
      createEventReportFormSchema(now).safeParse({
        ...validInput,
        occurredAt: "2026-07-15T15:00:01.000Z",
      }).success,
    ).toBe(false);
  });

  it("requires market and outcome identifiers together", () => {
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        outcomeId: undefined,
      }).success,
    ).toBe(false);
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        marketId: undefined,
      }).success,
    ).toBe(false);
  });

  it("accepts up to five JPEG, PNG or WebP files of at most 10 MiB", () => {
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        files: Array.from({ length: 5 }, (_, index) => ({
          name: `preuve-${index}.webp`,
          size: 10 * 1024 * 1024,
          type: "image/webp",
        })),
      }).success,
    ).toBe(true);
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        files: Array.from({ length: 6 }, (_, index) => ({
          name: `preuve-${index}.png`,
          size: 1,
          type: "image/png",
        })),
      }).success,
    ).toBe(false);
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        files: [{ name: "preuve.gif", size: 1, type: "image/gif" }],
      }).success,
    ).toBe(false);
    expect(
      eventReportFormSchema.safeParse({
        ...validInput,
        files: [
          {
            name: "preuve.jpg",
            size: 10 * 1024 * 1024 + 1,
            type: "image/jpeg",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
